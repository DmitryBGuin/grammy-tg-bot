# Многоступенчатая сборка для оптимизации размера образа

# Stage 1: Сборка
FROM node:20-alpine AS builder

# Установка зависимостей для сборки
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Копирование исходного кода и компиляция TypeScript
COPY src ./src
COPY tsconfig.json ./
RUN npm run build

# Stage 2: Запуск приложения
FROM node:20-alpine AS runner

# Установка зависимостей для выполнения
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Копирование скомпилированного кода из builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Создание непривилегированного пользователя для запуска
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Смена владельца файлов
RUN chown -R nextjs:nodejs /app
USER nextjs:nodejs

# Запуск приложения
EXPOSE 3000
CMD ["node", "dist/index.js"]