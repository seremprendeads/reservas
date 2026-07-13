export type PaymentProviderSlug = 'mercadopago' | 'stripe' | 'paypal' | 'crypto';

export type PaymentProviderStatus = 'connected' | 'disconnected';

export type PaymentProvider = {
  id: string;
  shop_id: string;
  provider: PaymentProviderSlug;
  access_token: string | null;
  client_id: string | null;
  client_secret: string | null;
  wallet_address: string | null;
  public_key: string | null;
  status: PaymentProviderStatus;
  last_tested_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentProviderConfig = {
  slug: PaymentProviderSlug;
  name: string;
  description: string;
  icon: string;
  color: string;
  fields: PaymentField[];
  helpUrl: string;
  helpLabel: string;
};

export type PaymentField = {
  key: string;
  label: string;
  type: 'password' | 'text';
  placeholder: string;
};
