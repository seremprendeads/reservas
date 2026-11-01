import { useState, useEffect, useRef } from 'react';
import { useBusiness } from '../../contexts/BusinessContext';
import * as session from '../../lib/admin-session';

function parseTrialEnd(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function useAdminAuth() {
  const { business, loading: businessLoading, setBusinessById } = useBusiness();
  const [loggedIn, setLoggedIn] = useState(session.isLoggedIn);
  const [adminEmail, setAdminEmail] = useState(session.getEmail);
  const [adminName, setAdminName] = useState(session.getName);
  const [adminAvatar, setAdminAvatar] = useState(session.getAvatar);
  const [trialWarningOpen, setTrialWarningOpen] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [trialCountdown, setTrialCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const trialWarningShownRef = useRef(false);

  const [darkMode, setDarkMode] = useState(() => {
    // Arranca siempre en claro. Antes tomaba la preferencia del sistema, asi
    // que un usuario nuevo con el SO en oscuro entraba al admin a oscuras.
    const isDark = localStorage.getItem('admin_dark') === '1';
    document.documentElement.classList.toggle('dark', isDark);
    return isDark;
  });

  useEffect(() => {
    localStorage.setItem('admin_dark', darkMode ? '1' : '0');
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleLogout = () => {
    session.clearSession();
    setLoggedIn(false);
  };

  // La fecha de prueba se toma del negocio cargado desde la base. Antes se leía
  // siempre de sessionStorage, que podía conservar una fecha vieja de otro
  // login y mostrar "Tu prueba está por vencer" a un cliente con plan pago.
  useEffect(() => {
    if (!loggedIn || businessLoading) return;

    const endDate = business
      ? (business.is_trial ? parseTrialEnd(business.trial_ends_at) : null)
      : parseTrialEnd(session.getTrialEndsAt());

    if (!endDate) {
      // Cliente con plan pago (o sin prueba): no hay cuenta regresiva ni aviso.
      setTrialDaysLeft(null);
      setTrialWarningOpen(false);
      return;
    }

    const checkTrial = () => {
      const diffMs = endDate.getTime() - Date.now();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      setTrialDaysLeft(days > 0 ? days : 0);

      if (days <= 2 && !trialWarningShownRef.current) {
        trialWarningShownRef.current = true;
        setTrialWarningOpen(true);
      }
    };

    checkTrial();
    const interval = setInterval(checkTrial, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loggedIn, businessLoading, business?.is_trial, business?.trial_ends_at]);

  useEffect(() => {
    if (!loggedIn || businessLoading) return;

    const endDate = business
      ? (business.is_trial ? parseTrialEnd(business.trial_ends_at) : null)
      : parseTrialEnd(session.getTrialEndsAt());

    if (!endDate) {
      setTrialCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const update = () => {
      const diff = Math.max(0, endDate.getTime() - Date.now());
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTrialCountdown({ days: d, hours: h, minutes: m, seconds: s });
    };
    update();
    const ticker = setInterval(update, 1000);
    return () => clearInterval(ticker);
  }, [loggedIn, businessLoading, business?.is_trial, business?.trial_ends_at]);

  const handleLogin = async (email: string, _token: string) => {
    setAdminEmail(email);
    setAdminName(session.getName());
    setAdminAvatar(session.getAvatar());

    const storedBusinessId = session.getBusinessId();
    if (storedBusinessId) {
      await setBusinessById(storedBusinessId);
      setLoggedIn(true);
    } else {
      window.location.href = '/create-business';
    }
  };

  return {
    loggedIn,
    adminEmail,
    adminName,
    setAdminName,
    adminAvatar,
    setAdminAvatar,
    darkMode,
    setDarkMode,
    trialWarningOpen,
    setTrialWarningOpen,
    trialDaysLeft,
    trialCountdown,
    handleLogin,
    handleLogout,
  };
}