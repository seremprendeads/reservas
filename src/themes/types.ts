export interface Theme {
  id: string;
  name: string;
  icon: string;
  description: string;
  tokens: ThemeTokens;
}

export interface ThemeTokens {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  background: string;
  cardBg: string;
  text: string;
  textMuted: string;
  caption: string;
  border: string;
  ring: string;
  inputBg: string;
  success: string;
  warning: string;
  error: string;
}
