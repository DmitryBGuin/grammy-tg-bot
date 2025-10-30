# Makefile для управления Docker-контейнером бота
# Основные цели:
# - build: сборка Docker-образа
# - start: запуск контейнера в фоне
# - stop: остановка контейнера
# - restart: перезапуск контейнера
# - logs: просмотр логов контейнера
# - down: остановка и удаление контейнера
# - status: проверка статуса контейнера
# - dev: запуск контейнера в режиме разработки
# - clean: удаление собранных образов

# Переменные
DOCKER_COMPOSE_FILE = docker-compose.yml
CONTAINER_NAME = tg-bot
IMAGE_NAME = tg-bot:latest

# Сборка Docker-образа
.PHONY: build
build:
	docker build --no-cache -t $(IMAGE_NAME) .

# Запуск контейнера в фоне
.PHONY: start
start:
	docker-compose -f $(DOCKER_COMPOSE_FILE) up -d

# Остановка контейнера
.PHONY: stop
stop:
	docker-compose -f $(DOCKER_COMPOSE_FILE) stop

# Перезапуск контейнера
.PHONY: restart
restart:
	docker-compose -f $(DOCKER_COMPOSE_FILE) restart

# Просмотр логов контейнера
.PHONY: logs
logs:
	docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f

# Остановка и удаление контейнера
.PHONY: down
down:
	docker-compose -f $(DOCKER_COMPOSE_FILE) down

# Проверка статуса контейнера
.PHONY: status
status:
	docker-compose -f $(DOCKER_COMPOSE_FILE) ps

# Запуск контейнера в режиме разработки
.PHONY: dev
dev:
	docker-compose -f $(DOCKER_COMPOSE_FILE) up

# Удаление собранных образов
.PHONY: clean
clean:
	docker rmi -f $(IMAGE_NAME) 2>/dev/null || true