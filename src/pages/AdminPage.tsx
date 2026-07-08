import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminProfile() {
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados NUEVOS para la sección del perfil
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Estados para la interfaz
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Obtener el email del administrador logueado al cargar el componente
  useEffect(() => {
    async function getAdminData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    }
    getAdminData();
  }, []);

  // Función NUEVA para guardar los datos del perfil
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileLoading(true);
    // Acá iría tu lógica con Supabase para actualizar la tabla de perfiles
    setTimeout(() => setIsProfileLoading(false), 1000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    // Validaciones de seguridad básicas
    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
      setLoading(false);
      return;
    }

    try {
      // Actualización de credenciales directa en Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setStatusMessage({ type: 'success', text: 'Contraseña actualizada con éxito. Ya podés usar tu nueva clave.' });
      
      // Limpiar el formulario
      setCurrentPassword('');
      自由newPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setStatusMessage({ type: 'error', text: error.message || 'Ocurrió un error al actualizar la contraseña.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="max-w-4xl mx-auto p-6 md:p-10 bg-white font-sans text-stone-900">
      
      <div class="border-b border-stone-200 pb-5 mb-8">
        <h1 class="text-2xl font-semibold tracking-tight text-stone-900">Mi Perfil</h1>
        <p class="text-sm text-stone-500 mt-1">Gestioná las credenciales de acceso de la plataforma de reservas.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div class="md:col-span-1">
          <h2 class="text-xs font-semibold tracking-wider uppercase text-stone-400">Datos de la Cuenta</h2>
          <p class="text-xs text-stone-500 mt-1">Identificación del administrador en el sistema.</p>
        </div>

        <div class="md:col-span-2 bg-stone-50 p-6 rounded border border-stone-100 space-y-4">
          <div>
            <label class="block text-xs font-medium text-stone-600 uppercase tracking-wider mb-1">Rol de Acceso</label>
            <input type="text" value="Administrador Principal" disabled class="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded text-stone-500 text-sm cursor-not-allowed" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-600 uppercase tracking-wider mb-1">Correo Electrónico</label>
            <input type="email" value={email} disabled class="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded text-stone-500 text-sm cursor-not-allowed" />
          </div>
        </div>

        <div class="col-span-1 md:col-span-3 border-t border-stone-200 my-4"></div>

        <div class="md:col-span-1">
          <h2 class="text-xs font-semibold tracking-wider uppercase text-stone-900">Datos Personales</h2>
          <p class="text-xs text-stone-500 mt-1">Información de contacto pública y nombre comercial.</p>
        </div>

        <div class="md:col-span-2">
          <form onSubmit={handleProfileUpdate} class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1">Nombre Comercial / Completo</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Ser Emprende" 
                  class="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 text-sm focus:outline-none focus:border-stone-900 transition-colors"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1">Teléfono de Contacto</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 11 0000-0000" 
                  class="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 text-sm focus:outline-none focus:border-stone-900 transition-colors"
                />
              </div>
            </div>
            
            <div class="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={isProfileLoading}
                class="px-5 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white text-xs font-medium tracking-wide uppercase rounded transition-colors shadow-sm"
              >
                {isProfileLoading ? 'Actualizando...' : 'Actualizar Datos'}
              </button>
            </div>
          </form>
        </div>

        <div class="col-span-1 md:col-span-3 border-t border-stone-200 my-4"></div>

        <div class="md:col-span-1">
          <h2 class="text-xs font-semibold tracking-wider uppercase text-stone-900">Seguridad</h2>
          <p class="text-xs text-stone-500 mt-1">Colocá la clave temporal que te llegó por email para establecer tu contraseña definitiva.</p>
        </div>

        <div class="md:col-span-2">
          <form onSubmit={handlePasswordChange} class="space-y-4">
            
            <div>
              <label class="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1">Contraseña Actual o Temporal</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Pegá la clave del mail aquí" 
                required 
                class="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 text-sm focus:outline-none focus:border-stone-900 transition-colors"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1">Nueva Contraseña</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres" 
                  required 
                  class="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 text-sm focus:outline-none focus:border-stone-900 transition-colors"
                />
              </div>
              
              <div>
                <label class="block text-xs font-medium text-stone-700 uppercase tracking-wider mb-1">Confirmar Nueva Contraseña</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetir nueva contraseña" 
                  required 
                  class="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 text-sm focus:outline-none focus:border-stone-900 transition-colors"
                />
              </div>
            </div>

            {statusMessage && (
              <div class={`text-xs py-2 px-3 rounded border ${
                statusMessage.type === 'success' 
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-100' 
                  : 'text-red-700 bg-red-50 border-red-100'
              }`}>
                {statusMessage.text}
              </div>
            )}

            <div class="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={loading}
                class="px-5 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white text-xs font-medium tracking-wide uppercase rounded transition-colors shadow-sm"
              >
                {loading ? 'Guardando...' : 'Actualizar Contraseña'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}