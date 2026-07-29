import { useState, useEffect, useRef } from 'react';
import { useBusiness } from '../../contexts/BusinessContext';
import * as session from '../../lib/admin-session';

export function useAdminAuth() {
  const { setBusinessById } = useBusiness();
  const [loggedIn, setLoggedIn] = useState(session.isLoggedIn);
  const [adminEmail, setAdminEmail] = useState(session.getEmail);
  const [adminName, setAdminName] = useState(session.getName);
  const [adminAvatar, setAdminAvatar] = useState(session.getAvatar);
  const [trialWarningOpen, setTrialWarningOpen] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [trialCountdown, setTrialCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const trialWarningShownRef = useRef(false);

  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('admin_dark');
    const isDark = stored !== null ? stored === '1' : window.matchMedia('(prefers-color-scheme: dark)').matches;
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

  useEffect(() => {
    if (!loggedIn) return;

    const checkTrial = () => {
      const now = new Date();
      const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0);
      const diffMs = endDate.getTime() - now.getTime();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      setTrialDaysLeft(days > 0 ? days : 0);

      if (days <= 5 && !trialWarningShownRef.current) {
        trialWarningShownRef.current = true;
        setTrialWarningOpen(true);
      }
    };

    checkTrial();
    const interval = setInterval(checkTrial, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loggedIn) return;
    const update = () => {
      const now = new Date();
      const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0);
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
  }, [loggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

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
