export type PaymentProviderSlug = 'mercadopago' | 'stripe' | 'paypal' | 'crypto';

export type PaymentProviderStatus = 'connected' | 'disconnected';

export type PaymentProvider = {
  id: string;
  business_id: string;
  provider: PaymentProviderSlug;
  access_token: string | null;
  client_id: string | null;
  client_secret: string | null;
  webhook_secret: string | null;
  wallet_address: string | null;
  public_key: string | null;
  status: PaymentProviderStatus;
  /** Indican si el secreto está cargado. El contenido nunca llega al navegador. */
  has_access_token?: boolean;
  has_client_secret?: boolean;
  has_webhook_secret?: boolean;
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
  /** ID del video de YouTube con el tutorial de conexión. Vacío = no se muestra. */
  tutorialYoutubeId?: string;
  fields: PaymentField[];
  helpUrl: string;
  helpLabel: string;
};

export type PaymentField = {
  key: string;
  label: string;
  type: 'password' | 'text';
  placeholder: string;
  /** Texto de ayuda bajo el campo. Para los que no son obvios de encontrar. */
  hint?: string;
};
