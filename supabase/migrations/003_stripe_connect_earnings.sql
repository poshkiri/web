-- =============================================================================
-- Миграция 003: Stripe Connect — stripe_account_id в users, таблица earnings
-- =============================================================================

-- Колонка для Stripe Connect Express account id
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_account_id text;

COMMENT ON COLUMN public.users.stripe_account_id IS 'Stripe Connect Express account id для выплат продавцу';

-- Таблица доходов продавцов (после transfer с платформы на Connect-аккаунт)
CREATE TABLE public.earnings (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id          uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  asset_id           uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  amount             numeric(10, 2) NOT NULL CHECK (amount >= 0),
  platform_fee       numeric(10, 2) NOT NULL CHECK (platform_fee >= 0),
  stripe_transfer_id text,
  status             text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_at         timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.earnings IS 'Доходы продавцов: 80% с продажи, запись после stripe.transfers.create';

CREATE INDEX idx_earnings_seller_id ON public.earnings(seller_id);
CREATE INDEX idx_earnings_asset_id ON public.earnings(asset_id);
CREATE INDEX idx_earnings_status ON public.earnings(status);
CREATE INDEX idx_earnings_created_at ON public.earnings(created_at DESC);

-- RLS
ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;

-- Продавец видит только свои записи
CREATE POLICY "earnings_select_own" ON public.earnings
  FOR SELECT USING (auth.uid() = seller_id);

-- INSERT/UPDATE/DELETE только через service role (вебхук, API с проверкой)
