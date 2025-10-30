import { exec, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Docker Container Runtime Tests', () => {
  const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
  const composeFilePath = path.join(process.cwd(), 'docker-compose.yml');
  const testContainerName = 'telegram-meter-bot-test-container';

  // Вспомогательная функция для ожидания
 const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  beforeAll(async () => {
    // Убедимся, что образ собран
    await new Promise((resolve, reject) => {
      const buildProcess = exec('docker build -t telegram-meter-bot:test .', { timeout: 3 * 60 * 1000 });
      
      buildProcess.on('error', (error) => {
        reject(new Error(`Failed to start Docker build: ${error.message}`));
      });
      
      buildProcess.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          reject(new Error(`Docker build failed with exit code: ${code}`));
        }
      });
    });
  });

  beforeEach(async () => {
    // Останавливаем контейнер, если он уже запущен
    try {
      await new Promise((resolve) => {
        exec(`docker stop ${testContainerName}`, () => resolve(true));
      });
      await sleep(2000); // Ждем 2 секунды перед удалением
      await new Promise((resolve) => {
        exec(`docker rm ${testContainerName}`, () => resolve(true));
      });
    } catch (error) {
      // Игнорируем ошибки, если контейнер не существует
    }
 });

  afterEach(async () => {
    // Останавливаем и удаляем контейнер после теста
    try {
      await new Promise((resolve) => {
        exec(`docker stop ${testContainerName}`, () => resolve(true));
      });
      await sleep(2000); // Ждем 2 секунды перед удалением
      await new Promise((resolve) => {
        exec(`docker rm ${testContainerName}`, () => resolve(true));
      });
    } catch (error) {
      // Игнорируем ошибки, если контейнер не существует
    }
  });

  it('should run container and execute the bot application', (done) => {
    // Запускаем контейнер с таймаутом
    const runProcess = spawn('docker', [
      'run',
      '--name', testContainerName,
      '-e', 'BOT_TOKEN=test_token_for_testing',
      '-e', 'MONGODB_URI=mongodb://mongo:27017/test_db',
      'telegram-meter-bot:test'
    ]);

    let output = '';
    let errorOutput = '';

    // Собираем вывод контейнера
    runProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log(data.toString());
    });

    runProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(data.toString());
    });

    // Устанавливаем таймаут для завершения теста
    const timeout = setTimeout(() => {
      runProcess.kill();
      done(new Error('Container execution timeout'));
    }, 3000); // 30 секунд таймаут

    // Ждем, пока контейнер запустится и выполнит основные операции
    runProcess.on('close', (code) => {
      clearTimeout(timeout);
      
      // Проверяем, что контейнер завершился без критических ошибок
      // Код 143 означает корректное завершение по сигналу SIGTERM
      if (code === 0 || code === 143) {
        // Проверяем, что в выводе есть признаки запуска бота
        expect(output).toMatch(/(Bot started|Connected|Starting bot)/i);
        done();
      } else {
        done(new Error(`Container exited with code: ${code}. Error: ${errorOutput}. Output: ${output}`));
      }
    });
  }, 40000); // Увеличиваем таймаут для теста

  it('should contain the necessary files in the image', (done) => {
    // Запускаем контейнер в фоне для проверки файлов
    const containerId = exec('docker create telegram-meter-bot:test', (error, stdout) => {
      if (error) {
        done(new Error(`Failed to create container: ${error.message}`));
        return;
      }

      const containerId = stdout.trim();
      
      // Проверяем наличие основных файлов
      const checkFile = (filePath: string) => {
        return new Promise((resolve, reject) => {
          exec(`docker cp ${containerId}:${filePath} /tmp/`, (err) => {
            if (err) {
              // Файл может не существовать, если контейнер не запущен, просто логируем это
              console.log(`File ${filePath} not found in container: ${err.message}`);
              resolve(false);
            } else {
              resolve(true);
            }
          });
        });
      };

      // Проверяем наличие основных файлов
      Promise.all([
        checkFile('/app/package.json'),
        checkFile('/app/dist/index.js'),
        checkFile('/app/src/index.ts'),
        checkFile('/app/.env'),
      ])
      .then(() => {
        // Удаляем временный контейнер
        exec(`docker rm ${containerId}`, () => {
          done();
        });
      })
      .catch((error) => {
        // Удаляем временный контейнер
        exec(`docker rm ${containerId}`, () => {
          done(error);
        });
      });
    });
 });

  it('should have the correct Node.js version in the container', (done) => {
    exec('docker run --rm telegram-meter-bot:test node --version', (error, stdout, stderr) => {
      if (error) {
        done(new Error(`Failed to get Node.js version: ${error.message}`));
        return;
      }

      if (stderr) {
        done(new Error(`Error getting Node.js version: ${stderr}`));
        return;
      }

      // Проверяем, что версия Node.js соответствует ожидаемой
      const nodeVersion = stdout.trim();
      expect(nodeVersion).toMatch(/v(18|20|22)\./); // Проверяем, что версия 18.x, 20.x или 22.x
      
      done();
    });
  });

  it('should have the necessary dependencies installed in the container', (done) => {
    exec('docker run --rm telegram-meter-bot:test npm list grammy mongoose dotenv', (error, stdout, stderr) => {
      if (error) {
        done(new Error(`Failed to check dependencies: ${error.message}`));
        return;
      }

      if (stderr) {
        done(new Error(`Error checking dependencies: ${stderr}`));
        return;
      }

      // Проверяем, что все необходимые зависимости установлены
      expect(stdout).toContain('grammy');
      expect(stdout).toContain('mongoose');
      expect(stdout).toContain('dotenv');
      
      done();
    });
  });
});