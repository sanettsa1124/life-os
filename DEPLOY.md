# Деплой на Render.com

## Способ 1: Через Blueprint (рекомендуется)

1. Запушьте код в GitHub/GitLab
2. Зайдите на [render.com](https://render.com) → **New** → **Blueprint**
3. Подключите ваш репозиторий
4. Render автоматически прочитает `render.yaml` и создаст Static Site
5. Нажмите **Apply** — сайт задеплоится

## Способ 2: Вручную

1. Зайдите на [render.com](https://render.com) → **New** → **Static Site**
2. Подключите репозиторий
3. Заполните настройки:
   - **Name**: `life-os` (или любое другое)
   - **Branch**: `main`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Node Version**: `18`
4. Добавьте Rewrite Rule:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Status**: `200`
5. Нажмите **Create Static Site**

## Обновление версии Service Worker

При каждом обновлении приложения увеличивайте версию в `public/sw.js`:
```js
const CACHE_NAME = 'life-os-v2'; // → 'life-os-v3'
```
Это заставит браузеры загрузить свежую версию.

## Переменные окружения (опционально)

В Render → **Environment** можно добавить:
| Ключ | Значение |
|------|----------|
| `NODE_VERSION` | `18` |

## Проверка после деплоя

- [ ] Сайт открывается по HTTPS
- [ ] SPA навигация работает (обновление страницы на любом маршруте)
- [ ] Данные сохраняются в localStorage
- [ ] PWA иконки отображаются
- [ ] Service Worker зарегистрирован (DevTools → Application → Service Workers)

## Troubleshooting

**Белый экран после обновления:**
Откройте DevTools → Application → Storage → Clear site data

**Старая версия кэшируется:**
Увеличьте `CACHE_NAME` в `public/sw.js` и задеплойте снова.

**Шрифты не загружаются:**
Render кэширует статические файлы. Добавьте заголовки в render.yaml:
```yaml
headers:
  - path: /assets/*
    name: Cache-Control
    value: public, max-age=31536000, immutable
```
