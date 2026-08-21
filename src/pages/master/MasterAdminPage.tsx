import { useState } from 'react';
import { masterIsLoggedIn } from '../../lib/master-session';
import { MasterLoginScreen } from './MasterLoginScreen';
import { MasterDashboard } from './MasterDashboard';

export function MasterAdminPage() {
  const [loggedIn, setLoggedIn] = useState(masterIsLoggedIn);

  if (!loggedIn) {
    return <MasterLoginScreen onLogin={() => setLoggedIn(true)} />;
  }

  return <MasterDashboard onLogout={() => setLoggedIn(false)} />;
}
