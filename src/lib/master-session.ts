// Sesión del Master Admin — completamente separada de admin-session.ts
// Usa claves de sessionStorage distintas para evitar cualquier colisión.
// El token master NO tiene business_id y es firmado con MASTER_JWT_SECRET (backend).

const KEYS = {
  loggedIn: 'master_logged_in',
  email: 'master_email',
  token: 'master_token',
  name: 'master_name',
} as const;

export function masterIsLoggedIn(): boolean {
  return !!sessionStorage.getItem(KEYS.loggedIn);
}

export function masterGetToken(): string {
  return sessionStorage.getItem(KEYS.token) || '';
}

export function masterGetEmail(): string {
  return sessionStorage.getItem(KEYS.email) || '';
}

export function masterGetName(): string {
  return sessionStorage.getItem(KEYS.name) || '';
}

export function masterSaveSession(data: { email: string; token: string; name: string }): void {
  sessionStorage.setItem(KEYS.loggedIn, '1');
  sessionStorage.setItem(KEYS.email, data.email);
  sessionStorage.setItem(KEYS.token, data.token);
  sessionStorage.setItem(KEYS.name, data.name);
}

export function masterClearSession(): void {
  sessionStorage.removeItem(KEYS.loggedIn);
  sessionStorage.removeItem(KEYS.email);
  sessionStorage.removeItem(KEYS.token);
  sessionStorage.removeItem(KEYS.name);
}
