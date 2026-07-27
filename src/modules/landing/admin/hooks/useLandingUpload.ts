import { useState, useRef, useCallback } from 'react';
import { supabase, type Business } from '../../../../lib/supabase';
import { compressImage } from '../../../../lib/image-utils';
import { useImageUpload } from '../../../../hooks/useImageUpload';
import type { LandingSections } from '../../types';
import { normalizeImages } from '../../lib/landing-utils';

interface UseLandingUploadOptions {
  business: Business | null;
  setLogoUrl: (v: string) => void;
  setSections: React.Dispatch<React.SetStateAction<LandingSections>>;
}

interface UseLandingUploadResult {
  uploadingImage: string | null;
  uploadError: string | null;
  clearUploadError: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  triggerUpload: (target: string) => void;
}

export function useLandingUpload({ business, setLogoUrl, setSections }: UseLandingUploadOptions): UseLandingUploadResult {
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [localUploadError, setLocalUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string>('');
  const {
    clearError,
  } = useImageUpload({
    bucket: 'branding',
    pathPrefix: '',
    filePrefix: 'landing',
    compress: (file) => compressImage(file, { maxWidth: 1920, maxHeight: 1080 }),
  });

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !business?.id) return;
    const target = uploadTargetRef.current;
    if (!target) return;
    setUploadingImage(target);
    setLocalUploadError(null);
    try {
      const path = `${business.id}/landing-${target}-${Date.now()}.webp`;
      const blob = await compressImage(file, { maxWidth: 1920, maxHeight: 1080 });
      const { error } = await supabase.storage.from('branding').upload(path, blob, {
        upsert: false, contentType: 'image/webp',
      });
      if (error) throw new Error(error.message || 'Error al subir imagen al servidor');
      const { data: urlData } = supabase.storage.from('branding').getPublicUrl(path);
      const publicUrl = (urlData?.publicUrl || '') + `?t=${Date.now()}`;

      if (target === 'logo') {
        setLogoUrl(publicUrl);
      } else if (target === 'hero_image') {
        setSections(prev => ({ ...prev, hero: { ...prev.hero, image_url: publicUrl } }));
      } else if (target === 'hero_presentation') {
        setSections(prev => ({ ...prev, hero: { ...prev.hero, presentation_image_url: publicUrl } }));
      } else if (target === 'hero_bg_image') {
        setSections(prev => ({ ...prev, hero: { ...prev.hero, background_image: publicUrl } }));
      } else if (target === 'hero_cover_image') {
        setSections(prev => ({ ...prev, hero: { ...prev.hero, cover_image: publicUrl } }));
      } else if (target === 'about_image') {
        setSections(prev => ({ ...prev, about: { ...prev.about, image_url: publicUrl } }));
      } else if (target === 'cta_image') {
        setSections(prev => ({ ...prev, cta: { ...prev.cta, image_url: publicUrl } }));
      } else if (target === 'banner_image') {
        setSections(prev => ({ ...prev, banner: { ...prev.banner, image_url: publicUrl } }));
      } else if (target === 'popup_image') {
        setSections(prev => ({ ...prev, popup: { ...prev.popup, image_url: publicUrl } }));
      } else if (target === 'shop_invite_image') {
        setSections(prev => ({ ...prev, shop_invite: { ...prev.shop_invite, image_url: publicUrl } }));
      } else if (target.startsWith('gallery_')) {
        const idx = parseInt(target.split('_')[1]);
        setSections(prev => {
          const normalized = normalizeImages(prev.gallery.images);
          const newImages = [...normalized];
          newImages[idx] = { url: publicUrl, title: newImages[idx]?.title || '', description: newImages[idx]?.description || '' };
          return { ...prev, gallery: { ...prev.gallery, images: newImages } };
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir imagen';
      setLocalUploadError(msg);
      console.error('Upload error:', err);
    } finally {
      setUploadingImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [business?.id, setLogoUrl, setSections, clearError]);

  const triggerUpload = useCallback((target: string) => {
    uploadTargetRef.current = target;
    setLocalUploadError(null);
    fileInputRef.current?.click();
  }, []);

  return {
    uploadingImage,
    uploadError: localUploadError,
    clearUploadError: () => setLocalUploadError(null),
    fileInputRef,
    handleImageUpload,
    triggerUpload,
  };
}
