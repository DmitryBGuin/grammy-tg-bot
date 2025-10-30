import mongoose from 'mongoose';
import connectDB from '../../src/database';

// Мокируем process.env.MONGODB_URI
const originalEnv = process.env;

describe('Database Connection', () => {
  beforeAll(() => {
    // Устанавливаем фиктивный URL для тестирования
    process.env.MONGODB_URI = 'mongodb://localhost/test_db';
  });

 afterAll(() => {
    // Восстанавливаем оригинальные значения
    process.env = originalEnv;
  });

  it('should connect to the database successfully', async () => {
    // Мокируем mongoose.connect
    const mockConnection = {
      connection: {
        host: 'localhost:27017'
      }
    };
    
    const connectSpy = jest.spyOn(mongoose, 'connect').mockResolvedValue(mockConnection as any);
    
    // Мокируем console.log для подавления вывода в консоль
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const result = await connectDB();
    
    expect(connectSpy).toHaveBeenCalledWith('mongodb://localhost/test_db');
    expect(result).toEqual(mockConnection);
    expect(consoleSpy).toHaveBeenCalledWith('MongoDB Connected: localhost:27017');
    
    // Восстанавливаем моки
    connectSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('should handle connection errors', async () => {
    // Мокируем mongoose.connect, чтобы он выбрасывал ошибку
    const connectSpy = jest.spyOn(mongoose, 'connect').mockRejectedValue(new Error('Connection failed'));
    
    // Мокируем console.error для подавления вывода в консоль
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Мокируем process.exit
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
      // Не вызываем process.exit, а просто запоминаем, что он был вызван
      return undefined as never;
    });

    await connectDB();

    expect(connectSpy).toHaveBeenCalledWith('mongodb://localhost/test_db');
    expect(errorSpy).toHaveBeenCalledWith('Error connecting to MongoDB:', new Error('Connection failed'));
    expect(exitSpy).toHaveBeenCalledWith(1);
    
    // Восстанавливаем моки
    connectSpy.mockRestore();
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('should handle connection events correctly', async () => {
    const mockConnection = {
      connection: {
        host: 'localhost:27017',
        on: jest.fn()
      }
    };
    
    const connectSpy = jest.spyOn(mongoose, 'connect').mockResolvedValue(mockConnection as any);
    const onSpy = jest.spyOn(mongoose.connection, 'on').mockImplementation(() => mongoose.connection);
    
    // Мокируем console.log для подавления вывода в консоль
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await connectDB();
    
    // Проверяем, что были зарегистрированы обработчики событий
    expect(onSpy).toHaveBeenCalledWith('connected', expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith('error', expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith('disconnected', expect.any(Function));
    
    // Восстанавливаем моки
    connectSpy.mockRestore();
    onSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('should handle SIGINT event for graceful shutdown', async () => {
    const mockConnection = {
      connection: {
        host: 'localhost:27017',
        on: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined)
      }
    };
    
    const connectSpy = jest.spyOn(mongoose, 'connect').mockResolvedValue(mockConnection as any);
    const closeSpy = jest.spyOn(mongoose.connection, 'close').mockResolvedValue(undefined);
    
    // Мокируем console.log для подавления вывода в консоль
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Мокируем process.exit
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
      // Не вызываем process.exit, а просто запоминаем, что он был вызван
      return undefined as never;
    });
    
    // Мокируем process.on, чтобы избежать установки реального обработчика SIGINT
    const originalProcessOn = process.on;
    const processOnSpy = jest.spyOn(process, 'on').mockImplementation((event, handler) => {
      if (event === 'SIGINT') {
        // Вызываем обработчик сразу для тестирования
        (handler as () => void)();
      }
      return process;
    });
    
    await connectDB();
    
    // Проверяем, что соединение было закрыто
    expect(closeSpy).toHaveBeenCalled();
    
    // Восстанавливаем моки
    connectSpy.mockRestore();
    closeSpy.mockRestore();
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
    // Восстанавливаем оригинальный process.on
    process.on = originalProcessOn;
  });
});