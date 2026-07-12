export type BioProfile = {
  id: string;
  admin_email: string;
  slug: string;
  name: string;
  description: string;
  avatar_url: string | null;
  city: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  social_instagram: string | null;
  social_tiktok: string | null;
  social_facebook: string | null;
  social_youtube: string | null;
  social_twitter: string | null;
  social_linkedin: string | null;
  primary_color: string;
  bg_type: 'solid' | 'gradient' | 'image';
  bg_solid_color: string;
  bg_gradient_from: string;
  bg_gradient_to: string;
  bg_image_url: string | null;
  button_style: 'rounded' | 'pill' | 'square';
  button_shadow: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BioLink = {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type BioStats = {
  totalVisits: number;
  totalClicks: number;
  clicksByLink: { link_id: string; title: string; count: number }[];
  dailyClicks: { date: string; count: number }[];
  topLink: string;
};
