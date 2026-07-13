import { PaymentProviderConfig } from './types';

export const PAYMENT_PROVIDERS: PaymentProviderConfig[] = [
  {
    slug: 'mercadopago',
    name: 'Mercado Pago',
    description: 'Cobrás con la billetera de Mercado Pago. Aceptá tarjetas, cuentas y efectivo.',
    icon: '💙',
    color: 'from-blue-500 to-blue-600',
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'APP_USR-...' },
      { key: 'client_id', label: 'Client ID (OAuth)', type: 'text', placeholder: '123456789...' },
      { key: 'client_secret', label: 'Client Secret (OAuth)', type: 'password', placeholder: '...' },
    ],
    helpUrl: 'https://www.mercadopago.com.ar/developers/en/docs/your-integrations/credentials',
    helpLabel: 'Cómo obtener mis credenciales',
  },
  {
    slug: 'stripe',
    name: 'Stripe',
    description: 'Gateway de pagos global. Aceptá tarjetas de todo el mundo con una integración moderna.',
    icon: '💜',
    color: 'from-violet-500 to-violet-600',
    fields: [
      { key: 'access_token', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...' },
      { key: 'public_key', label: 'Publishable Key', type: 'text', placeholder: 'pk_live_...' },
    ],
    helpUrl: 'https://dashboard.stripe.com/apikeys',
    helpLabel: 'Cómo obtener mis claves de API',
  },
  {
    slug: 'paypal',
    name: 'PayPal',
    description: 'Aceptá pagos internacionales con PayPal. Ideal para clientes fuera del país.',
    icon: '🟡',
    color: 'from-amber-500 to-amber-600',
    fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'AQk...' },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'EHj...' },
    ],
    helpUrl: 'https://developer.paypal.com/api/rest/',
    helpLabel: 'Cómo obtener mis credenciales',
  },
  {
    slug: 'crypto',
    name: 'Bitcoin / Criptomonedas',
    description: 'Preparado para integraciones futuras con BTCPay, Coinbase Commerce y más.',
    icon: '🟠',
    color: 'from-orange-500 to-orange-600',
    fields: [
      { key: 'wallet_address', label: 'Dirección de wallet', type: 'text', placeholder: 'bc1q...' },
    ],
    helpUrl: '',
    helpLabel: '',
  },
];
