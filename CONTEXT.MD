# Проект: Торговая площадка игровых ресурсов

## Стек
- Фреймворк: Next.js 14 (App Router, TypeScript)
- Стилизация: Tailwind CSS + shadcn/ui
- База данных: Supabase (PostgreSQL + RLS + Storage)
- Аутентификация: Supabase Auth (email + Google OAuth)
- Платежи: Stripe (Checkout + Connect)
- Email: Resend
- Развертывание: Vercel

## Целевая аудитория
- Покупатели: инди-разработчики (Unity/Unreal) + геймеры (скины/моды)
- Продавцы: художники, звукорежиссеры, моддеры

## Структура
src/
├── app/
│ ├── (auth)/ # вход, регистрация
│ ├── (dashboard)/ # покупки, мои ресурсы, доходы
│ ├── assets/ # каталог + [slug]
│ ├── admin/ # панель модерации2
│ └── api/ # оформление заказа, веб-хуки, загрузка
├── components/
│ ├── ui/ # shadcn
│ ├── assets/ # AssetCard, Галерея, Фильтры
│ └── layout/ # Заголовок, Нижний колонтитул
├── lib/
│ ├── supabase.ts
│ ├── stripe.ts
│ └── utils.ts
└── types/index.ts

## Таблицы базы данных
- users: id, email, name, avatar_url, role, bio, website
- assets: id, title, slug, description, price, category,
file_url, preview_images[], tags[], engine,
is_approved, downloads_count, rating_avg, author_id
- categories: id, name, slug, icon
- purchases: id, user_id, asset_id, amount, stripe_id
- reviews: id, user_id, asset_id, rating, comment
- collections: id, seller_id, title, asset_ids[], price

## Правила
- Строгий режим TypeScript везде
- Компоненты сервера по умолчанию
- Все обращения к БД через /lib/supabase.ts
- Подписанные URL-адреса для загрузки файлов (срок действия 1 час)
- Водяной знак на всех изображениях предварительного просмотра
- Обработка ошибок с помощью try/catch + toast
- Дизайн, ориентированный на мобильные устройства