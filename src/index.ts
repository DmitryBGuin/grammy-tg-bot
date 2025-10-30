import 'dotenv/config';
import { Bot } from 'grammy';
import { GrammyError, HttpError } from 'grammy';
import mongoose from 'mongoose';
import connectDB from './database.js';
import { User, MeterReading } from './models/index.js';
import { validateMeterReadings, validateReadingsInputFormat, validateUserData } from './validation.js';

// Убедимся, что токен бота загружен из переменной окружения
if (!process.env.BOT_TOKEN) {
  console.error('BOT_TOKEN is not set in environment variables!');
  process.exit(1);
}

// Подключаемся к базе данных
connectDB();

const bot = new Bot(process.env.BOT_TOKEN!);

// Ответ на команду /start
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
    await handleError(ctx, error as Error, 'обработка команды /start');
  }
});

// Команда регистрации пользователя
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
    await handleError(ctx, error as Error, 'регистрация пользователя');
  }
});

// Команда для ввода показаний счетчиков
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
    await handleError(ctx, error as Error, 'ввод показаний счетчиков');
  }
});

// Команда для просмотра истории показаний
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
    await handleError(ctx, error as Error, 'получение истории показаний');
  }
});

// Команда помощи
bot.command('help', async (ctx) => {
  try {
    const helpMessage =
      `Доступные команды бота:\n\n` +
      `/start - Начать работу с ботом\n` +
      `/register - Зарегистрироваться в системе\n` +
      `/submit_readings - Отправить показания счетчиков воды\n` +
      `/history - Просмотреть историю отправленных показаний\n` +
      `/help - Показать это сообщение помощи`;
    
    await ctx.reply(helpMessage);
  } catch (error) {
    await handleError(ctx, error as Error, 'обработка команды /help');
  }
});

// Ответ на любое сообщение
bot.on('message', (ctx) => {
  if (ctx.message.text) {
    ctx.reply(ctx.message.text);
 }
});

// Функция для централизованной обработки ошибок
const handleError = async (ctx: any, error: Error, action: string) => {
  console.error(`Ошибка при выполнении действия "${action}":`, error);
  
  try {
    await ctx.reply('Произошла ошибка при обработке запроса. Пожалуйста, попробуйте позже.');
  } catch (replyError) {
    console.error('Ошибка при отправке сообщения об ошибке пользователю:', replyError);
  }
};

// Обработка ошибок согласно документации
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;

  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e);
  } else {
    console.error('Unknown error:', e);
  }
});

// Функция запуска бота
async function startBot() {
  try {
    bot.start();
    console.log('Bot started');
  } catch (error) {
    console.error('Error in startBot:', error);
  }
}

startBot();
