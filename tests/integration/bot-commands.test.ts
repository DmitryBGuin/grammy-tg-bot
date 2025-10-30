import { Bot, Context, session, SessionFlavor } from 'grammy';
import mongoose from 'mongoose';
import { User, MeterReading } from '../../src/models/index.js';
import { validateMeterReadings, validateReadingsInputFormat, validateUserData } from '../../src/validation.js';

// Создаем тип для сессии
interface SessionData {
  // Здесь можно определить структуру сессии, если она используется
}
type MyContext = Context & SessionFlavor<SessionData>;

// Мокируем подключение к базе данных
jest.mock('../../src/database', () => ({
  connectDB: jest.fn(() => Promise.resolve()),
}));

// Мокируем dotenv/config
jest.mock('dotenv/config', () => ({}));

// Мокируем process.env.BOT_TOKEN
const originalEnv = process.env;
beforeAll(() => {
  process.env.BOT_TOKEN = 'test-token';
});
afterAll(() => {
  process.env = originalEnv;
});

describe('Bot Commands Integration Tests', () => {
  let bot: Bot<MyContext>;
  
  beforeAll(async () => {
    // Подключаемся к тестовой базе данных
    await mongoose.connect('mongodb://localhost/test_db_for_integration_tests');
  });

  afterAll(async () => {
    // Закрываем подключение к тестовой базе данных
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Очищаем коллекции перед каждым тестом
    await User.deleteMany({});
    await MeterReading.deleteMany({});
    
    // Создаем нового бота для каждого теста
    bot = new Bot<MyContext>('test-token', { botInfo: { id: 123456789, is_bot: true, first_name: 'Test Bot', username: 'test_bot', can_join_groups: true, can_read_all_group_messages: true, supports_inline_queries: true, can_connect_to_business: true, has_main_web_app: true } });
    
    // Добавляем middleware для сессий, если используется
    bot.use(session({
      initial: () => ({}),
    }));
    
    // Регистрируем команды бота
    bot.command('start', async (ctx) => {
      try {
        // Проверяем, существует ли пользователь в базе данных
        let user = await User.findOne({ telegramId: ctx.from?.id });
        
        if (!user) {
          // Валидируем данные пользователя
          const userDataValidation = validateUserData(
            ctx.from?.first_name || '',
            ctx.from?.last_name,
            ctx.from?.username
          );
          
          if (!userDataValidation.isValid) {
            await ctx.reply(`При регистрации возникла ошибка: ${userDataValidation.error}`);
            return;
          }
          
          // Создаем нового пользователя
          user = new User({
            telegramId: ctx.from?.id,
            firstName: ctx.from?.first_name,
            lastName: ctx.from?.last_name,
            username: ctx.from?.username,
            isRegistered: false, // Пользователь еще не завершил регистрацию
          });
          
          await user.save();
          console.log(`Новый пользователь создан: ${ctx.from?.first_name} (ID: ${ctx.from?.id})`);
        }
        
        // Отправляем приветственное сообщение
        await ctx.reply(
          `Вас приветствует телеграм-бот ЖСК Западный г. Москва по приему показаний счетчиков воды\n\n` +
          `Для регистрации в системе используйте команду /register`
        );
      } catch (error) {
        await ctx.reply('Произошла ошибка при обработке команды /start');
      }
    });
    
    bot.command('register', async (ctx) => {
      try {
        const telegramId = ctx.from?.id;
        
        if (!telegramId) {
          await ctx.reply('Не удалось получить ID пользователя. Попробуйте снова.');
          return;
        }
        
        // Находим пользователя в базе данных
        const user = await User.findOne({ telegramId });
        
        if (!user) {
          await ctx.reply('Пользователь не найден. Попробуйте начать диалог с ботом заново командой /start');
          return;
        }
        
        // Проверяем, не зарегистрирован ли уже пользователь
        if (user.isRegistered) {
          await ctx.reply('Вы уже зарегистрированы в системе.');
          return;
        }
        
        // Обновляем статус регистрации
        user.isRegistered = true;
        user.registrationDate = new Date();
        await user.save();
        
        await ctx.reply('Вы успешно зарегистрировались в системе! Теперь вы можете отправлять показания счетчиков воды.');
      } catch (error) {
        await ctx.reply('Произошла ошибка при регистрации');
      }
    });
    
    bot.command('submit_readings', async (ctx) => {
      try {
        const telegramId = ctx.from?.id;
        
        if (!telegramId) {
          await ctx.reply('Не удалось получить ID пользователя.');
          return;
        }
        
        // Находим пользователя в базе данных
        const user = await User.findOne({ telegramId });
        
        if (!user) {
          await ctx.reply('Пользователь не найден. Пожалуйста, сначала зарегистрируйтесь с помощью команды /start и /register.');
          return;
        }
        
        if (!user.isRegistered) {
          await ctx.reply('Для использования этой команды вы должны быть зарегистрированы. Используйте команду /register для регистрации.');
          return;
        }
        
        // Проверяем, есть ли в сообщении текст (предполагаем, что это показания)
        if (!ctx.message?.text) {
          await ctx.reply(
            'Для отправки показаний используйте команду в формате: /submit_readings ХХХХ ХХХХ\n' +
            'где первое число - показания холодной воды, второе - горячей воды (например: /submit_readings 1234.5 678.9)'
          );
          return;
        }
        
        // Валидируем формат ввода
        const formatValidation = validateReadingsInputFormat(ctx.message.text);
        
        if (!formatValidation.isValid) {
          await ctx.reply(formatValidation.error!);
          return;
        }
        
        const [coldWater, hotWater] = formatValidation.values!;
        
        // Валидируем значения показаний
        const validation = validateMeterReadings(coldWater, hotWater);
        
        if (!validation.isValid) {
          await ctx.reply(validation.error!);
          return;
        }
        
        // Создаем запись с показаниями
        const meterReading = new MeterReading({
          userId: user._id,
          coldWater,
          hotWater,
          readingDate: new Date(), // Текущая дата как дата снятия показаний
        });
        
        await meterReading.save();
        
        // Добавляем ссылку на показания в пользователя
        user.meterReadings.push(meterReading._id as mongoose.Types.ObjectId);
        await user.save();
        
        await ctx.reply(
          `Показания успешно сохранены!\n` +
          `Холодная вода: ${coldWater}\n` +
          `Горячая вода: ${hotWater}\n` +
          `Дата снятия: ${new Date().toLocaleDateString('ru-RU')}`
        );
        
      } catch (error) {
        await ctx.reply('Произошла ошибка при вводе показаний');
      }
    });
    
    bot.command('history', async (ctx) => {
      try {
        const telegramId = ctx.from?.id;
        
        if (!telegramId) {
          await ctx.reply('Не удалось получить ID пользователя.');
          return;
        }
        
        // Находим пользователя в базе данных
        const user = await User.findOne({ telegramId });
        
        if (!user) {
          await ctx.reply('Пользователь не найден. Пожалуйста, сначала зарегистрируйтесь с помощью команды /start и /register.');
          return;
        }
        
        if (!user.isRegistered) {
          await ctx.reply('Для использования этой команды вы должны быть зарегистрированы. Используйте команду /register для регистрации.');
          return;
        }
        
        // Получаем историю показаний пользователя
        const readings = await MeterReading.find({ userId: user._id })
          .sort({ submittedAt: -1 }) // Сортируем по дате отправки в обратном порядке (новые первыми)
          .limit(10); // Ограничиваем последние 10 записей
        
        if (readings.length === 0) {
          await ctx.reply('У вас пока нет сохраненных показаний счетчиков.');
          return;
        }
        
        // Формируем сообщение с историей
        let historyMessage = 'Ваша история показаний счетчиков (последние 10):\n\n';
        
        for (const reading of readings) {
          historyMessage += `• ${reading.coldWater} (холодная) / ${reading.hotWater} (горячая) - ` +
                            `${reading.submittedAt.toLocaleDateString('ru-RU')}\n`;
        }
        
        await ctx.reply(historyMessage);
        
      } catch (error) {
        await ctx.reply('Произошла ошибка при получении истории показаний');
      }
    });
  });

  it('should handle /start command and create a new user', async () => {
    const mockCtx: any = {
      from: {
        id: 123456789,
        first_name: 'Иван',
        last_name: 'Иванов',
        username: 'ivan_ivanov',
      },
      reply: jest.fn(),
    };

    await bot.init();
    await bot.handleUpdate({
      update_id: 1,
      message: {
        message_id: 1,
        from: mockCtx.from,
        chat: { id: 1, type: 'private', first_name: 'Иван' },
        date: Date.now(),
        text: '/start',
      },
    });

    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Вас приветствует телеграм-бот ЖСК Западный г. Москва')
    );

    // Проверяем, что пользователь был создан в базе данных
    const user = await User.findOne({ telegramId: 123456789 });
    expect(user).toBeDefined();
    expect(user?.firstName).toBe('Иван');
    expect(user?.isRegistered).toBe(false);
  });

  it('should handle /register command and update user registration status', async () => {
    // Сначала создаем пользователя
    const user = new User({
      telegramId: 987654321,
      firstName: 'Анна',
      isRegistered: false,
    });
    await user.save();

    const mockCtx: any = {
      from: {
        id: 987654321,
      },
      reply: jest.fn(),
    };

    await bot.init();
    await bot.handleUpdate({
      update_id: 2,
      message: {
        message_id: 2,
        from: mockCtx.from,
        chat: { id: 2, type: 'private', first_name: 'Test' },
        date: Date.now(),
        text: '/register',
      },
    });

    expect(mockCtx.reply).toHaveBeenCalledWith(
      'Вы успешно зарегистрировались в системе! Теперь вы можете отправлять показания счетчиков воды.'
    );

    // Проверяем, что пользователь обновился в базе данных
    const updatedUser = await User.findOne({ telegramId: 987654321 });
    expect(updatedUser).toBeDefined();
    expect(updatedUser?.isRegistered).toBe(true);
 });

  it('should handle /submit_readings command and save meter readings', async () => {
    // Создаем зарегистрированного пользователя
    const user = new User({
      telegramId: 555123456,
      firstName: 'Петр',
      isRegistered: true,
    });
    await user.save();

    const mockCtx: any = {
      from: {
        id: 55123456,
      },
      message: {
        text: '/submit_readings 1234.5 678.9',
      },
      reply: jest.fn(),
    };

    await bot.init();
    await bot.handleUpdate({
      update_id: 3,
      message: {
        message_id: 3,
        from: mockCtx.from,
        chat: { id: 3, type: 'private', first_name: 'Test' },
        date: Date.now(),
        text: '/submit_readings 1234.5 678.9',
      },
    });

    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Показания успешно сохранены!')
    );

    // Проверяем, что показания были сохранены в базе данных
    const meterReading = await MeterReading.findOne({ userId: user._id });
    expect(meterReading).toBeDefined();
    expect(meterReading?.coldWater).toBe(1234.5);
    expect(meterReading?.hotWater).toBe(678.9);

    // Проверяем, что ссылка на показания добавлена к пользователю
    const updatedUser = await User.findOne({ telegramId: 55123456 }).populate('meterReadings');
    expect(updatedUser?.meterReadings).toHaveLength(1);
  });

  it('should handle /history command and return user meter readings history', async () => {
    // Создаем зарегистрированного пользователя
    const user = new User({
      telegramId: 44455666,
      firstName: 'Мария',
      isRegistered: true,
    });
    await user.save();

    // Добавляем несколько показаний
    const reading1 = new MeterReading({
      userId: user._id,
      coldWater: 1000.0,
      hotWater: 500.0,
      readingDate: new Date(Date.now() - 86400000), // вчера
    });
    const reading2 = new MeterReading({
      userId: user._id,
      coldWater: 1010.0,
      hotWater: 510.0,
      readingDate: new Date(), // сегодня
    });
    await reading1.save();
    await reading2.save();

    // Обновляем пользователя, добавляя ссылки на показания
    user.meterReadings.push(reading1._id as mongoose.Types.ObjectId, reading2._id as mongoose.Types.ObjectId);
    await user.save();

    const mockCtx: any = {
      from: {
        id: 44555666,
      },
      reply: jest.fn(),
    };

    await bot.init();
    await bot.handleUpdate({
      update_id: 4,
      message: {
        message_id: 4,
        from: mockCtx.from,
        chat: { id: 4, type: 'private', first_name: 'Test' },
        date: Date.now(),
        text: '/history',
      },
    });

    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Ваша история показаний счетчиков')
    );
    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('1010 (холодная) / 510 (горячая)')
    );
  });

 it('should return error when user is not registered and tries to submit readings', async () => {
    // Создаем незарегистрированного пользователя
    const user = new User({
      telegramId: 77788999,
      firstName: 'Сергей',
      isRegistered: false,
    });
    await user.save();

    const mockCtx: any = {
      from: {
        id: 77888999,
      },
      message: {
        text: '/submit_readings 1234.5 678.9',
      },
      reply: jest.fn(),
    };

    await bot.init();
    await bot.handleUpdate({
      update_id: 5,
      message: {
        message_id: 5,
        from: mockCtx.from,
        chat: { id: 5, type: 'private', first_name: 'Test' },
        date: Date.now(),
        text: '/submit_readings 1234.5 678.9',
      },
    });

    expect(mockCtx.reply).toHaveBeenCalledWith(
      'Для использования этой команды вы должны быть зарегистрированы. Используйте команду /register для регистрации.'
    );
  });

  it('should return error for invalid readings format', async () => {
    // Создаем зарегистрированного пользователя
    const user = new User({
      telegramId: 111222333,
      firstName: 'Ольга',
      isRegistered: true,
    });
    await user.save();

    const mockCtx: any = {
      from: {
        id: 11222333,
      },
      message: {
        text: '/submit_readings invalid input',
      },
      reply: jest.fn(),
    };

    await bot.init();
    await bot.handleUpdate({
      update_id: 6,
      message: {
        message_id: 6,
        from: mockCtx.from,
        chat: { id: 6, type: 'private', first_name: 'Test' },
        date: Date.now(),
        text: '/submit_readings invalid input',
      },
    });

    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Неверный формат')
    );
 });
});