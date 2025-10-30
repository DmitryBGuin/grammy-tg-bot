import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Docker Container Tests', () => {
  const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
  const composeFilePath = path.join(process.cwd(), 'docker-compose.yml');

  it('should have Dockerfile in the project root', () => {
    expect(fs.existsSync(dockerfilePath)).toBe(true);
  });

  it('should have docker-compose.yml in the project root', () => {
    expect(fs.existsSync(composeFilePath)).toBe(true);
  });

  it('should build Docker image successfully', (done) => {
    // Таймаут для выполнения команды (3 минуты)
    const timeout = 3 * 60 * 1000;
    
    const buildProcess = exec('docker build -t telegram-meter-bot:test .', { timeout });
    
    buildProcess.on('error', (error) => {
      done(new Error(`Failed to start Docker build: ${error.message}`));
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        done();
      } else {
        done(new Error(`Docker build failed with exit code: ${code}`));
      }
    });
    
    // Выводим логи сборки в консоль для отладки
    buildProcess.stdout?.on('data', (data) => {
      console.log(data.toString());
    });
    
    buildProcess.stderr?.on('data', (data) => {
      console.error(data.toString());
    });
  }, 300000); // Увеличиваем таймаут для теста до 5 минут

  it('should have correct Dockerfile structure', () => {
    const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
    
    // Проверяем наличие основных элементов Dockerfile
    expect(dockerfileContent).toContain('FROM node:');
    expect(dockerfileContent).toContain('WORKDIR');
    expect(dockerfileContent).toContain('COPY package*.json');
    expect(dockerfileContent).toContain('RUN npm ci --only=production');
    expect(dockerfileContent).toContain('COPY package*.json .');
    expect(dockerfileContent).toContain('EXPOSE');
    expect(dockerfileContent).toContain('CMD');
    
    // Проверяем, что используется правильная версия Node.js
    expect(dockerfileContent).toMatch(/FROM node:(18|20|22|lts)/);
  });

  it('should have correct docker-compose.yml structure', () => {
    const composeContent = fs.readFileSync(composeFilePath, 'utf8');
    
    // Проверяем наличие основных элементов docker-compose.yml
    expect(composeContent).toContain('version:');
    expect(composeContent).toContain('services:');
    expect(composeContent).toContain('container_name: telegram-bot');
    expect(composeContent).toContain('build:');
    expect(composeContent).toContain('environment:');
    expect(composeContent).toContain('MONGODB_URI=${MONGODB_URI}');
    expect(composeContent).toContain('ports:');
  });
});