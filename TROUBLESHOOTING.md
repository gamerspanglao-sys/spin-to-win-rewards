# 🔧 Решение проблем с запуском

## Если проект не запускается

### 1. Проверьте установку Node.js
```bash
node --version
npm --version
```

Если не установлено, установите Node.js с [nodejs.org](https://nodejs.org/)

### 2. Установите зависимости
```bash
npm install
```

### 3. Очистите кеш и переустановите
```bash
rm -rf node_modules package-lock.json
npm install
```

### 4. Запустите проект
```bash
npm run dev
```

### 5. Если используете Bun
```bash
bun install
bun run dev
```

---

## Возможные ошибки

### Ошибка: "Cannot find module"
- Удалите `node_modules` и `package-lock.json`
- Запустите `npm install` заново

### Ошибка: "Port already in use"
- Измените порт в `vite.config.ts`
- Или убейте процесс на порту: `lsof -ti:5173 | xargs kill`

### Ошибка компиляции CSS
- Проверьте синтаксис в `src/index.css`
- Убедитесь, что Tailwind правильно настроен

### Ошибка TypeScript
- Проверьте `tsconfig.json`
- Убедитесь, что все импорты правильные

---

## Проверка изменений

После исправления CSS синтаксиса, проект должен запускаться. 

Если все еще не работает, покажите ошибку из консоли!
