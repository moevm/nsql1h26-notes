# Инструкция по запуску приложения

### Склонировать репозиторий
```bash
git clone https://github.com/moevm/nsql1h26-notes.git
cd nsql1h26-notes
```
### Запустить проект через Docker
```bash
docker compose up -d --build
```
### Тестирование
Приложение будет доступно по адресу http://localhost:4173  
Тестовые пользователи (значения из файла `.env`):
- Администратор: `ADMIN_USERNAME` / `ADMIN_PASSWORD`
- Обычный пользователь: `USER_USERNAME` / `USER_PASSWORD`
