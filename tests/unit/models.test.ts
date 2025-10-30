import mongoose from 'mongoose';
import User, { IUser } from '../../src/models/User';
import MeterReading, { IMeterReading } from '../../src/models/MeterReading';

// Мокируем подключение к базе данных
jest.mock('../../src/database', () => ({
  connectDB: jest.fn(() => Promise.resolve()),
}));

describe('User Model', () => {
  beforeAll(async () => {
    // Подключаемся к тестовой базе данных
    await mongoose.connect('mongodb://localhost/test_db_for_unit_tests');
  });

  afterAll(async () => {
    // Закрываем подключение к тестовой базе данных
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Очищаем коллекции перед каждым тестом
    await User.deleteMany({});
    await MeterReading.deleteMany({});
  });

  it('should create a new user with required fields', async () => {
    const userData: Partial<IUser> = {
      telegramId: 123456789,
      firstName: 'Иван',
      isRegistered: true,
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.telegramId).toBe(123456789);
    expect(savedUser.firstName).toBe('Иван');
    expect(savedUser.isRegistered).toBe(true);
    expect(savedUser.registrationDate).toBeDefined();
  });

  it('should require telegramId and firstName', async () => {
    const user = new User({ isRegistered: true });
    
    let error: any;
    try {
      await user.save();
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.telegramId).toBeDefined();
    expect(error.errors.firstName).toBeDefined();
  });

  it('should have unique telegramId', async () => {
    const userData1: Partial<IUser> = {
      telegramId: 123456789,
      firstName: 'Иван',
    };

    const userData2: Partial<IUser> = {
      telegramId: 123456789, // такой же telegramId
      firstName: 'Петр',
    };

    const user1 = new User(userData1);
    await user1.save();

    const user2 = new User(userData2);
    let error: any;
    try {
      await user2.save();
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // код ошибки дублирования индекса в MongoDB
  });

  it('should create a user with optional fields', async () => {
    const userData: Partial<IUser> = {
      telegramId: 987654321,
      firstName: 'Анна',
      lastName: 'Иванова',
      username: 'anna_ivanova',
      waterMeters: {
        coldWater: 1234.5,
        hotWater: 678.9,
      },
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.telegramId).toBe(987654321);
    expect(savedUser.firstName).toBe('Анна');
    expect(savedUser.lastName).toBe('Иванова');
    expect(savedUser.username).toBe('anna_ivanova');
    expect(savedUser.waterMeters).toBeDefined();
    if (savedUser.waterMeters) {
      expect(savedUser.waterMeters.coldWater).toBe(1234.5);
      expect(savedUser.waterMeters.hotWater).toBe(678.9);
    }
  });
});

describe('MeterReading Model', () => {
  beforeAll(async () => {
    // Подключаемся к тестовой базе данных
    await mongoose.connect('mongodb://localhost/test_db_for_unit_tests');
  });

  afterAll(async () => {
    // Закрываем подключение к тестовой базе данных
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Очищаем коллекцию перед каждым тестом
    await MeterReading.deleteMany({});
  });

  it('should create a new meter reading with required fields', async () => {
    const user = new User({
      telegramId: 123456789,
      firstName: 'Иван',
    });
    const savedUser = await user.save();

    const meterReadingData: Partial<IMeterReading> = {
      userId: (savedUser._id as string).toString(),
      coldWater: 1234.5,
      hotWater: 678.9,
      readingDate: new Date(),
    };

    const meterReading = new MeterReading(meterReadingData);
    const savedMeterReading = await meterReading.save();

    expect(savedMeterReading._id).toBeDefined();
    expect(savedMeterReading.userId.toString()).toBe((savedUser._id as string).toString());
    expect(savedMeterReading.coldWater).toBe(1234.5);
    expect(savedMeterReading.hotWater).toBe(678.9);
    expect(savedMeterReading.readingDate).toBeDefined();
    expect(savedMeterReading.submittedAt).toBeDefined();
  });

  it('should require userId, coldWater, hotWater and readingDate', async () => {
    const meterReading = new MeterReading({
      coldWater: 1234.5,
      hotWater: 678.9,
    });
    
    let error: any;
    try {
      await meterReading.save();
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.userId).toBeDefined();
    expect(error.errors.readingDate).toBeDefined();
  });

  it('should not allow negative values for water meters', async () => {
    const user = new User({
      telegramId: 123456790, // уникальный ID
      firstName: 'Иван',
    });
    const savedUser = await user.save();

    const meterReadingData: Partial<IMeterReading> = {
      userId: (savedUser._id as string).toString(),
      coldWater: -100, // отрицательное значение
      hotWater: 678.9,
      readingDate: new Date(),
    };

    const meterReading = new MeterReading(meterReadingData);
    let error: any;
    try {
      await meterReading.save();
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.coldWater).toBeDefined();
  });

  it('should allow only non-negative values for water meters', async () => {
    const user = new User({
      telegramId: 123456791, // уникальный ID
      firstName: 'Иван',
    });
    const savedUser = await user.save();

    const meterReadingData: Partial<IMeterReading> = {
      userId: (savedUser._id as string).toString(),
      coldWater: 0, // нулевое значение
      hotWater: 0, // нулевое значение
      readingDate: new Date(),
    };

    const meterReading = new MeterReading(meterReadingData);
    const savedMeterReading = await meterReading.save();

    expect(savedMeterReading.coldWater).toBe(0);
    expect(savedMeterReading.hotWater).toBe(0);
  });
});