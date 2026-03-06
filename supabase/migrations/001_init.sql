-- =============================================================================
-- Миграция 001: Инициализация схемы БД для торговой площадки игровых ресурсов
-- Supabase (PostgreSQL) + RLS + триггеры
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ТАБЛИЦЫ
-- -----------------------------------------------------------------------------

-- Роль пользователя (опционально, можно заменить на text)
CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');

-- Таблица пользователей (профиль, синхронизируется с auth.users)
CREATE TABLE public.users (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  name          text,
  avatar_url    text,
  role          user_role NOT NULL DEFAULT 'buyer',
  bio           text,
  website       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.users IS 'Профили пользователей; id связан с auth.users';

-- Категории ресурсов
CREATE TABLE public.categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  slug       text NOT NULL UNIQUE,
  icon       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.categories IS 'Категории ассетов (2D, 3D, Audio и т.д.)';

-- Ресурсы (ассеты)
CREATE TABLE public.assets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  slug            text NOT NULL,
  description     text,
  price           numeric(10, 2) NOT NULL CHECK (price >= 0),
  category_id     uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  file_url        text,
  preview_images  text[] DEFAULT '{}',
  tags            text[] DEFAULT '{}',
  engine          text,
  is_approved     boolean NOT NULL DEFAULT false,
  downloads_count integer NOT NULL DEFAULT 0 CHECK (downloads_count >= 0),
  rating_avg      numeric(3, 2) CHECK (rating_avg IS NULL OR (rating_avg >= 0 AND rating_avg <= 5)),
  author_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (author_id, slug)
);

COMMENT ON TABLE public.assets IS 'Игровые ресурсы: модели, спрайты, аудио, шрифты, моды';

-- Покупки
CREATE TABLE public.purchases (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  asset_id   uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  amount     numeric(10, 2) NOT NULL CHECK (amount > 0),
  stripe_id  text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, asset_id)
);

COMMENT ON TABLE public.purchases IS 'История покупок ассетов (один раз на пользователя+ассет)';

-- Отзывы
CREATE TABLE public.reviews (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  asset_id   uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  rating     smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment    text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, asset_id)
);

COMMENT ON TABLE public.reviews IS 'Отзывы к ассетам; один отзыв на пользователя+ассет';

-- Коллекции (наборы ассетов от продавца)
CREATE TABLE public.collections (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      text NOT NULL,
  asset_ids  uuid[] DEFAULT '{}',
  price      numeric(10, 2) NOT NULL CHECK (price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.collections IS 'Наборы ассетов от продавца с общей ценой';

-- -----------------------------------------------------------------------------
-- 2. ИНДЕКСЫ
-- -----------------------------------------------------------------------------

CREATE INDEX idx_assets_category_id ON public.assets(category_id);
CREATE INDEX idx_assets_author_id ON public.assets(author_id);
CREATE INDEX idx_assets_slug ON public.assets(slug);
CREATE INDEX idx_assets_is_approved ON public.assets(is_approved);
CREATE INDEX idx_assets_rating_avg ON public.assets(rating_avg) WHERE rating_avg IS NOT NULL;
CREATE INDEX idx_assets_created_at ON public.assets(created_at DESC);
CREATE INDEX idx_assets_tags ON public.assets USING GIN(tags);

CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_asset_id ON public.purchases(asset_id);

CREATE INDEX idx_reviews_asset_id ON public.reviews(asset_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);

CREATE INDEX idx_collections_seller_id ON public.collections(seller_id);

-- -----------------------------------------------------------------------------
-- 3. НАЧАЛЬНЫЕ ДАННЫЕ: КАТЕГОРИИ
-- -----------------------------------------------------------------------------

INSERT INTO public.categories (name, slug, icon) VALUES
  ('2D Sprites',   '2d-sprites',   'sprite'),
  ('3D Models',    '3d-models',    'cube'),
  ('Audio',        'audio',        'music'),
  ('Fonts & UI',   'fonts-ui',     'type'),
  ('Mods',         'mods',         'puzzle');

-- -----------------------------------------------------------------------------
-- 4. RLS (Row Level Security)
-- -----------------------------------------------------------------------------

ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- users: чтение своего профиля и профилей других; изменение только своего
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- categories: только чтение для всех
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (true);

-- assets: SELECT для всех, INSERT/UPDATE только author
CREATE POLICY "assets_select" ON public.assets
  FOR SELECT USING (true);

CREATE POLICY "assets_insert_own" ON public.assets
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "assets_update_own" ON public.assets
  FOR UPDATE USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

-- purchases: SELECT и INSERT только владелец записи (user_id = auth.uid())
CREATE POLICY "purchases_select_own" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "purchases_insert_own" ON public.purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- reviews: SELECT для всех; INSERT только тот, кто купил этот asset (asset_id — из вставляемой строки)
CREATE POLICY "reviews_select" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_buyer" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.purchases p
      WHERE p.user_id = auth.uid() AND p.asset_id = asset_id
    )
  );

-- reviews: UPDATE/DELETE только свой отзыв
CREATE POLICY "reviews_update_own" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_delete_own" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- collections: SELECT для всех; INSERT/UPDATE только владелец (seller_id)
CREATE POLICY "collections_select" ON public.collections
  FOR SELECT USING (true);

CREATE POLICY "collections_insert_own" ON public.collections
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "collections_update_own" ON public.collections
  FOR UPDATE USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "collections_delete_own" ON public.collections
  FOR DELETE USING (auth.uid() = seller_id);

-- -----------------------------------------------------------------------------
-- 5. ТРИГГЕР: пересчёт rating_avg в assets при изменении reviews
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_asset_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_asset_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_asset_id := OLD.asset_id;
  ELSE
    target_asset_id := NEW.asset_id;
  END IF;

  UPDATE public.assets
  SET
    rating_avg = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM public.reviews
      WHERE asset_id = target_asset_id
    ),
    updated_at = now()
  WHERE id = target_asset_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.update_asset_rating() IS 'Пересчитывает rating_avg в assets при INSERT/UPDATE/DELETE в reviews';

CREATE TRIGGER trigger_update_asset_rating
  AFTER INSERT OR UPDATE OF rating OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_asset_rating();

-- -----------------------------------------------------------------------------
-- 6. ТРИГГЕР: создание записи в public.users при регистрации в auth.users
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.on_auth_user_created() IS 'Создаёт профиль в public.users при регистрации через Supabase Auth';

-- Триггер вешается на auth.users (схема auth)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.on_auth_user_created();

-- -----------------------------------------------------------------------------
-- 7. ТРИГГЕРЫ updated_at
-- -----------------------------------------------------------------------------
-- Автоматическое обновление поля updated_at при UPDATE в users, assets, collections

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
