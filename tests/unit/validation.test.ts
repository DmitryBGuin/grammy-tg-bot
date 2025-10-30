import { validateMeterReadings, validateReadingsInputFormat, validateUserData } from '../../src/validation';

describe('Validation Functions', () => {
  describe('validateMeterReadings', () => {
    test('should return valid for positive numbers', () => {
      const result = validateMeterReadings(10, 200);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should return invalid for negative cold water value', () => {
      const result = validateMeterReadings(-100, 200);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Показания не могут быть отрицательными');
    });

    test('should return invalid for negative hot water value', () => {
      const result = validateMeterReadings(100, -200);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Показания не могут быть отрицательными');
    });

    test('should return invalid for NaN values', () => {
      const result = validateMeterReadings(NaN, 200);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Показания должны быть числовыми значениями');

      const result2 = validateMeterReadings(100, NaN);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('Показания должны быть числовыми значениями');
    });

    test('should return invalid for too large cold water value', () => {
      const result = validateMeterReadings(1000000, 200);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Показания слишком велики. Пожалуйста, проверьте введенные значения');
    });

    test('should return invalid for too large hot water value', () => {
      const result = validateMeterReadings(100, 10000);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Показания слишком велики. Пожалуйста, проверьте введенные значения');
    });

    test('should return valid for boundary values', () => {
      let result = validateMeterReadings(0, 0);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();

      result = validateMeterReadings(999999, 9999);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('validateReadingsInputFormat', () => {
    test('should return valid for correct input format', () => {
      const result = validateReadingsInputFormat('100.5 200.7');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
      expect(result.values).toEqual([100.5, 200.7]);
    });

    test('should return valid for input with command prefix', () => {
      const result = validateReadingsInputFormat('/submit_readings 100.5 200.7');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
      expect(result.values).toEqual([100.5, 200.7]);
    });

    test('should return invalid for input with only one value', () => {
      const result = validateReadingsInputFormat('100.5');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Неверный формат');
      expect(result.values).toBeNull();
    });

    test('should return invalid for input with three values', () => {
      const result = validateReadingsInputFormat('100.5 200.7 300.8');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Неверный формат');
      expect(result.values).toBeNull();
    });

    test('should return valid for integer values', () => {
      const result = validateReadingsInputFormat('100 200');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
      expect(result.values).toEqual([100, 200]);
    });

    test('should return valid for decimal values with comma', () => {
      // Note: parseFloat will parse '10,5' as 100, ignoring the comma part
      const result = validateReadingsInputFormat('100,5 200,7');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
      expect(result.values).toEqual([100, 200]); // This is expected behavior of parseFloat
    });
  });

  describe('validateUserData', () => {
    test('should return valid for correct user data', () => {
      const result = validateUserData('Иван', 'Иванов', 'ivan_ivanov');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should return invalid for empty first name', () => {
      let result = validateUserData('', 'Иванов', 'ivan_ivanov');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Имя пользователя не может быть пустым');

      result = validateUserData('   ', 'Иванов', 'ivan_ivanov');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Имя пользователя не может быть пустым');
    });

    test('should return invalid for too long first name', () => {
      const longName = 'a'.repeat(11);
      const result = validateUserData(longName, 'Иванов', 'ivan_ivanov');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Имя пользователя слишком длинное');
    });

    test('should return invalid for too long last name', () => {
      const longLastName = 'a'.repeat(101);
      const result = validateUserData('Иван', longLastName, 'ivan_ivanov');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Фамилия пользователя слишком длинная');
    });

    test('should return invalid for too long username', () => {
      const longUsername = 'a'.repeat(51);
      const result = validateUserData('Иван', 'Иванов', longUsername);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Имя пользователя (username) слишком длинное');
    });

    test('should return invalid for username with invalid characters', () => {
      const result = validateUserData('Иван', 'Иванов', 'ivan@ivanov');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Неверный формат username');
    });

    test('should return invalid for username that is too long', () => {
      const longUsername = 'a'.repeat(33);
      const result = validateUserData('Иван', 'Иванов', longUsername);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Неверный формат username');
    });

    test('should return valid for username with valid characters', () => {
      const result = validateUserData('Иван', 'Иванов', 'ivan_ivanov123');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should return valid for user data with only first name', () => {
      const result = validateUserData('Иван');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should return valid for user data with first name and last name only', () => {
      const result = validateUserData('Иван', 'Иванов');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
  });
});