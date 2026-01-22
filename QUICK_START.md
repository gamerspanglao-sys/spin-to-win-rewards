# ⚡ Быстрый старт

## Проблема: "Connection Failed"

Сервер не запущен! Нужно его запустить.

---

## Решение (пошагово):

### Шаг 1: Откройте терминал
В VS Code: `Terminal` → `New Terminal` (или `Ctrl+`` `)

### Шаг 2: Перейдите в папку проекта
```bash
cd /Users/admin/spin-to-win-rewards-1
```

### Шаг 3: Установите зависимости (если еще не установлены)
```bash
npm install
```

### Шаг 4: Запустите сервер
```bash
npm run dev
```

### Шаг 5: Дождитесь сообщения
Вы должны увидеть:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
```

### Шаг 6: Откройте в браузере
Нажмите на ссылку `http://localhost:8080/` или откройте вручную.

---

## Если не работает:

### Проверьте Node.js
```bash
node --version
npm --version
```

Если команды не найдены - установите Node.js с [nodejs.org](https://nodejs.org/)

### Очистите и переустановите
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Проверьте порт
Если порт 8080 занят, измените в `vite.config.ts`:
```typescript
port: 8081,  // или другой свободный порт
```

---

## Важно!

**Сервер должен быть запущен постоянно!** Не закрывайте терминал, пока работаете с проектом.

Если закрыли терминал - запустите снова `npm run dev`.
