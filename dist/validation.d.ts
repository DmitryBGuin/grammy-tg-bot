/**
 * Валидация показаний счетчиков воды
 * @param coldWater - показания холодной воды
 * @param hotWater - показания горячей воды
 * @returns объект с результатом валидации и сообщением об ошибке (если есть)
 */
export declare const validateMeterReadings: (coldWater: number, hotWater: number) => {
    isValid: boolean;
    error: string;
} | {
    isValid: boolean;
    error: null;
};
/**
 * Валидация формата ввода показаний
 * @param input - строка ввода от пользователя
 * @returns объект с результатом валидации и массивом чисел (если валидно)
 */
export declare const validateReadingsInputFormat: (input: string) => {
    isValid: boolean;
    error: string;
    values: null;
} | {
    isValid: boolean;
    error: null;
    values: number[];
};
/**
 * Валидация данных пользователя
 * @param firstName - имя пользователя
 * @param lastName - фамилия пользователя (опционально)
 * @param username - юзернейм (опционально)
 * @returns объект с результатом валидации
 */
export declare const validateUserData: (firstName: string, lastName?: string, username?: string) => {
    isValid: boolean;
    error: string;
} | {
    isValid: boolean;
    error: null;
};
//# sourceMappingURL=validation.d.ts.map