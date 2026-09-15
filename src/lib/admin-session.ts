const KEYS = {
  loggedIn: 'admin_logged_in',
  email: 'admin_email',
  token: 'admin_token',
  name: 'admin_name',
  avatar: 'admin_avatar',
  businessId: 'admin_business_id',
  trialEndsAt: 'admin_trial_ends_at',
  mustChangePassword: 'admin_must_change_password',
} as const;

export function isLoggedIn(): boolean {
  return !!sessionStorage.getItem(KEYS.loggedIn);
}

export function getEmail(): string {
  return sessionStorage.getItem(KEYS.email) || '';
}

export function getToken(): string {
  return sessionStorage.getItem(KEYS.token) || '';
}

export function getName(): string {
  return sessionStorage.getItem(KEYS.name) || '';
}

export function getAvatar(): string {
  return sessionStorage.getItem(KEYS.avatar) || '';
}

export function getBusinessId(): string | null {
  return sessionStorage.getItem(KEYS.businessId);
}

export function getTrialEndsAt(): string | null {
  return sessionStorage.getItem(KEYS.trialEndsAt);
}

export function setEmail(email: string): void {
  sessionStorage.setItem(KEYS.email, email);
}

export function setToken(token: string): void {
  sessionStorage.setItem(KEYS.token, token);
}

export function setName(name: string): void {
  sessionStorage.setItem(KEYS.name, name);
}

export function setAvatar(avatar: string): void {
  sessionStorage.setItem(KEYS.avatar, avatar);
}

export function setBusinessId(id: string): void {
  sessionStorage.setItem(KEYS.businessId, id);
}

export function setTrialEndsAt(date: string): void {
  sessionStorage.setItem(KEYS.trialEndsAt, date);
}

// Contrasena temporal: admin-login devuelve must_change_password cuando la
// clave es la que se entrego en la invitacion. Mientras sea true, el panel
// muestra la pantalla de cambio obligatorio y no deja pasar.
export function getMustChangePassword(): boolean {
  return sessionStorage.getItem(KEYS.mustChangePassword) === '1';
}

export function clearMustChangePassword(): void {
  sessionStorage.removeItem(KEYS.mustChangePassword);
}

export function saveLoginSession(data: {
  email: string;
  token: string;
  name?: string;
  businessId?: string;
  trialEndsAt?: string;
  mustChangePassword?: boolean;
}): void {
  sessionStorage.setItem(KEYS.loggedIn, '1');
  sessionStorage.setItem(KEYS.email, data.email);
  sessionStorage.setItem(KEYS.token, data.token);
  sessionStorage.setItem(KEYS.name, data.name || '');
  if (data.businessId) {
    sessionStorage.setItem(KEYS.businessId, data.businessId);
  }
  if (data.trialEndsAt) {
    sessionStorage.setItem(KEYS.trialEndsAt, data.trialEndsAt);
  }
  if (data.mustChangePassword) {
    sessionStorage.setItem(KEYS.mustChangePassword, '1');
  } else {
    sessionStorage.removeItem(KEYS.mustChangePassword);
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(KEYS.loggedIn);
  sessionStorage.removeItem(KEYS.email);
  sessionStorage.removeItem(KEYS.token);
  sessionStorage.removeItem(KEYS.name);
  sessionStorage.removeItem(KEYS.avatar);
  sessionStorage.removeItem(KEYS.businessId);
  sessionStorage.removeItem(KEYS.trialEndsAt);
  sessionStorage.removeItem(KEYS.mustChangePassword);
  localStorage.removeItem('reservas_business_id');
}