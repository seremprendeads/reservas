import { useState, useEffect } from 'react';
import { XCircle, Eye, EyeOff, Camera } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Separator } from '../../components/ui/separator';
import { Avatar } from '../../components/ui/avatar';
import { useBusiness } from '../../contexts/BusinessContext';
import { authInvoke } from './helpers';
import { setEmail as setSessionEmail, setName as setSessionName } from '../../lib/admin-session';
import { useImageUpload } from '../../hooks/useImageUpload';

export function ProfileManager({
  adminEmail, adminName, avatarUrl, onRefresh, showSuccess, onProfileUpdated, onAvatarChange
}: {
  adminEmail: string;
  adminName: string;
  avatarUrl: string;
  onRefresh: () => void;
  showSuccess: (msg: string) => void;
  onProfileUpdated: (name: string, email: string) => void;
  onAvatarChange: (url: string) => void;
}) {
  const { business, refreshBusiness } = useBusiness();
  const [bizName, setBizName] = useState(business?.name || '');
  const [name, setName] = useState(adminName);
  const [email, setEmail] = useState(adminEmail);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { uploading, uploadError, clearError, fileInputRef, handleFileChange } = useImageUpload({
    bucket: 'avatars',
    pathPrefix: business?.id || 'default',
    filePrefix: `avatar-${adminEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
    maxFileSize: 2 * 1024 * 1024,
  });

  useEffect(() => {
    if (business?.name) setBizName(business.name);
  }, [business?.name]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    handleFileChange(e, async (publicUrl) => {
      const { error: saveError } = await authInvoke('admin-update-profile', {
        avatar_url: publicUrl,
      });
      if (saveError) throw new Error(saveError.message || 'Error al guardar avatar');
      onAvatarChange(publicUrl);
      showSuccess('Imagen de perfil actualizada');
    }, (msg) => setError(msg));
  };

  const removeAvatar = () => {
    onAvatarChange('');
    showSuccess('Imagen de perfil eliminada');
  };

  const handleSave = async () => {
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanAdminEmail = adminEmail.trim().toLowerCase();

    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Ingresá un email válido');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    setSaving(true);
    try {
      if (bizName.trim() && bizName.trim() !== business?.name && business?.id) {
        const { data: bizRes, error: bizFnError } = await authInvoke('admin-update-business', {
          name: bizName.trim(),
        });
        if (bizFnError || !bizRes?.success) {
          setError(bizRes?.error || 'Error al actualizar el negocio');
          return;
        }
        refreshBusiness();
      }

      const { data, error: fnError } = await authInvoke('admin-update-profile', {
        name: name.trim(),
        newEmail: cleanEmail !== cleanAdminEmail ? cleanEmail : null,
        newPassword: newPassword || null,
      });

      if (fnError || !data?.success) {
        setError(data?.error || 'Error al guardar el perfil');
        return;
      }

      setSessionEmail(cleanEmail);
      setSessionName(name.trim());

      onProfileUpdated(name.trim(), cleanEmail);
      onRefresh();
      showSuccess('Perfil actualizado correctamente');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <Card className="shadow-[0_8px_30px_rgba(0,0,0,.05)]">
        <CardHeader>
          <CardTitle className="font-display">Mi Perfil</CardTitle>
          <CardDescription>Actualizá tus datos de administrador</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-5">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar
                  fallback={name.charAt(0).toUpperCase() || 'A'}
                  src={avatarUrl || null}
                  className="h-24 w-24 rounded-full ring-4 ring-background shadow-xl"
                />
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/0 transition-all duration-200 group-hover:bg-black/40">
                  <Camera className="h-8 w-8 text-white opacity-0 transition-all duration-200 group-hover:opacity-100" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground">200×200px recomendado · Máx 2MB</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  variant="outline"
                  size="sm"
                >
                  {uploading ? 'Subiendo...' : avatarUrl ? 'Cambiar foto' : 'Subir foto'}
                </Button>
                {avatarUrl && (
                  <Button onClick={removeAvatar} variant="ghost" size="sm" className="text-destructive">
                    Eliminar
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Nombre</label>
              <Input type="text" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <Separator />
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Nombre del negocio</label>
              <Input type="text" value={bizName} onChange={(e) => setBizName(e.target.value)}
                placeholder="Tatoo Greco" className="h-12 rounded-xl" />
              <p className="text-xs text-muted-foreground">
                Tus links: <span className="font-mono">{window.location.origin}/{bizName.trim() ? bizName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-') : '...'}</span>/bio, /reservas, /tienda
              </p>
            </div>
            <Separator />
            <p className="text-sm text-muted-foreground">
              Dejá los campos en blanco si no querés cambiar la contraseña.
            </p>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Nueva contraseña</label>
              <div className="relative">
                <Input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••" className="h-12 rounded-xl pr-12" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all duration-200">
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Confirmar nueva contraseña</label>
              <div className="relative">
                <Input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" className="h-12 rounded-xl pr-12" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all duration-200">
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} size="lg" className="w-full transition-all duration-200">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
