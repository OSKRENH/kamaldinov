# Редактор портфолио

Публичный сайт на GitHub Pages загружает данные из `content.json`. Редактор в `/admin/` готовит весь файл для коммита через GitHub. Для публикации из этой версии редактора нужен доступ на запись в репозиторий.

## Вход по почте и публикация из редактора

Worker рекомендуется развернуть отдельно от GitHub Pages. Скопируйте папку `admin/` в `cms/assets/admin/` для публикации. Сборка Worker импортирует общую модель из исходной папки `admin/`.

Настройте Cloudflare Access для Worker с методом One-time PIN и политикой Allow только для нужного адреса. Worker отдельно проверяет подпись токена, издателя, адрес пользователя, срок действия и аудиторию приложения. В переменных Worker укажите `ADMIN_EMAIL`, `ACCESS_AUD` и `ACCESS_TEAM_DOMAIN` (имя хоста без протокола, например `example.cloudflareaccess.com`).

В секрет Worker `GITHUB_TOKEN` добавьте fine-grained PAT с доступом только к `OSKRENH/kamaldinov` и разрешением Contents: Read and write. Добавляйте токен в секреты Worker через Dashboard или `wrangler secret put GITHUB_TOKEN`. Не храните токен в Git, в публичном редакторе или в файле данных.

После настройки откройте адрес Worker, войдите по email и проверьте сохранение. Каждая публикация создаёт коммит изменения `content.json` в `main`, откуда GitHub Pages собирает сайт.
