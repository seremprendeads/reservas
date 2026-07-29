import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BookingPage } from './pages/BookingPage';
import { AdminPage } from './pages/AdminPage';
import { ShopPage } from './modules/shop/pages/ShopPage';
import { BioPage } from './modules/bio/pages/BioPage';
import { LandingPage } from './modules/landing/pages/LandingPage';
import { CreateBusinessPage } from './pages/CreateBusinessPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { BusinessProvider } from './contexts/BusinessContext';
import { SuspendedGuard } from './modules/subscription';

function App() {
  return (
    <BusinessProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Admin panel - must be before catch-all */}
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/seremprende-entendo-administrativo" element={<AdminPage />} />
            <Route path="/create-business" element={<CreateBusinessPage />} />
            
            {/* Public booking page */}
            <Route path="/reservas" element={<SuspendedGuard><BookingPage /></SuspendedGuard>} />
            <Route path="/:slug/reservas" element={<SuspendedGuard><BookingPage /></SuspendedGuard>} />
            
            {/* Shop - public */}
            <Route path="/tienda" element={<SuspendedGuard><ShopPage /></SuspendedGuard>} />
            <Route path="/:slug/tienda" element={<SuspendedGuard><ShopPage /></SuspendedGuard>} />
            
            {/* Bio - public */}
            <Route path="/:slug/bio" element={<SuspendedGuard><BioPage /></SuspendedGuard>} />
            
            {/* Landing page - catch-all: / or /:slug */}
            <Route path="/" element={<SuspendedGuard><LandingPage /></SuspendedGuard>} />
            <Route path="/:slug" element={<SuspendedGuard><LandingPage /></SuspendedGuard>} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </BusinessProvider>
  );
}

export default App;
