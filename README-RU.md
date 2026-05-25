# Сжатие изображений

Веб-приложение для сжатия изображений с выгрузкой результата в ZIP-архив. Обработка выполняется **полностью в браузере** — файлы не отправляются на сервер.

**Сайт:** <a href="https://image-compressor-kappa-six.vercel.app/" target="_blank" rel="noopener noreferrer">https://image-compressor-kappa-six.vercel.app/</a>

**[English version →](README.md)**

## Назначение

- Сжатие изображений **JPEG**, **PNG** и **WebP** с настраиваемым качеством (10–100%).
- Загрузка через перетаскивание, выбор файлов или **целой папки** — структура вложенных каталогов сохраняется в архиве.
- **Прочие файлы** в папке попадают в ZIP без изменений.
- Скачивание одного **ZIP** с теми же путями, что и у исходного выбора.
- Интерфейс на **русском и английском** языках.

## Как работает сжатие

| Формат | Подход |
|--------|--------|
| JPEG / WebP | Перекодирование через Canvas с выбранным уровнем качества |
| PNG | Квантование цветов при низком качестве и оптимизация **oxipng**; при 100% — только без потерь |

Если сжатие не уменьшает размер файла, в архив попадает оригинал.

## Стек

- [Nuxt 4](https://nuxt.com) + Vue 3
- [@jsquash/oxipng](https://github.com/jamsinclair/jsquash) — оптимизация PNG в браузере
- [JSZip](https://stuk.github.io/jszip/) — сборка архива
- [Sharp](https://sharp.pixelplumbing.com/) — сжатие статических изображений при сборке (опционально)

Приложение собирается как **статический сайт** (`nuxt generate`) и может быть развёрнуто на Vercel или любом хостинге статики.

## Установка

Установите зависимости:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Разработка

Запуск dev-сервера на `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Сборка

Сборка для продакшена (результат в каталоге `dist/`):

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Локальный просмотр production-сборки:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Подробнее о деплое — в [документации Nuxt](https://nuxt.com/docs/getting-started/deployment).
