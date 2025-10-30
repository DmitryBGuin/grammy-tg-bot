// Функции валидации для данных бота

/**
 * Валидация показаний счетчиков воды
 * @param coldWater - показания холодной воды
 * @param hotWater - показания горячей воды
 * @returns объект с результатом валидации и сообщением об ошибке (если есть)
 */
export const validateMeterReadings = (coldWater: number, hotWater: number) => {
  // Проверяем, что значения не отрицательные
  if (coldWater < 0 || hotWater < 0) {
    return {
      isValid: false,
      error: 'Показания не могут быть отрицательными'
    };
 }

  // Проверяем, что значения не NaN
  if (isNaN(coldWater) || isNaN(hotWater)) {
    return {
      isValid: false,
      error: 'Показания должны быть числовыми значениями'
    };
  }

 // Проверяем, что значения разумны (например, не слишком большие)
  if (coldWater > 999999 || hotWater > 9999) {
    return {
      isValid: false,
      error: 'Показания слишком велики. Пожалуйста, проверьте введенные значения'
    };
  }

 // Проверяем, что значения не уменьшились по сравнению с предыдущими (если известны)
  // Эта проверка будет выполняться отдельно при наличии предыдущих значений

  return {
    isValid: true,
    error: null
 };
};

/**
 * Валидация формата ввода показаний
 * @param input - строка ввода от пользователя
 * @returns объект с результатом валидации и массивом чисел (если валидно)
 */
export const validateReadingsInputFormat = (input: string) => {
  // Убираем команду из строки (если есть)
  const args = input.trim().split(' ');
  if (args[0].startsWith('/')) {
    args.shift(); // Убираем команду
  }

 // Проверяем, что остались 2 аргумента
  if (args.length !== 2) {
    return {
      isValid: false,
      error: 'Неверный формат. Используйте команду в формате: /submit_readings ХХХХ ХХХХ\nгде первое число - показания холодной воды, второе - горячей воды (например: /submit_readings 1234.5 678.9)',
      values: null
    };
  }

  // Преобразуем строки в числа
  const coldWater = parseFloat(args[0]);
  const hotWater = parseFloat(args[1]);

  return {
    isValid: true,
    error: null,
    values: [coldWater, hotWater]
  };
};

/**
 * Валидация данных пользователя
 * @param firstName - имя пользователя
 * @param lastName - фамилия пользователя (опционально)
 * @param username - юзернейм (опционально)
 * @returns объект с результатом валидации
 */
export const validateUserData = (firstName: string, lastName?: string, username?: string) => {
  // Проверяем, что имя не пустое
  if (!firstName || firstName.trim().length === 0) {
    return {
      isValid: false,
      error: 'Имя пользователя не может быть пустым'
    };
  }

 // Проверяем максимальную длину полей
  if (firstName.length > 10) {
    return {
      isValid: false,
      error: 'Имя пользователя слишком длинное'
    };
  }

  if (lastName && lastName.length > 100) {
    return {
      isValid: false,
      error: 'Фамилия пользователя слишком длинная'
    };
  }

 if (username && username.length > 50) {
    return {
      isValid: false,
      error: 'Имя пользователя (username) слишком длинное'
    };
  }

  // Проверяем формат username (если указан)
  if (username && !/^[a-zA-Z0-9_]{1,32}$/.test(username)) {
    return {
      isValid: false,
      error: 'Неверный формат username. Username может содержать только латинские буквы, цифры и символ подчеркивания, длиной до 32 символов'
    };
  }

  return {
    isValid: true,
    error: null
  };
};