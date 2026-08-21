import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BookingPage } from './pages/BookingPage';
import { AdminPage } from './pages/AdminPage';
import { ShopPage } from './modules/shop/pages/ShopPage';
import { BioPage } from './modules/bio/pages/BioPage';
import { LandingPage } from './modules/landing/pages/LandingPage';
import { CreateBusinessPage } from './pages/CreateBusinessPage';
import { MasterAdminPage } from './pages/master/MasterAdminPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { BusinessProvider } from './contexts/BusinessContext';

function App() {
  return (
    <BusinessProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Master Admin - propietario BookingBio - separado de /admin */}
            <Route path="/master-admin" element={<MasterAdminPage />} />

            {/* Admin panel - must be before catch-all */}
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/seremprende-entendo-administrativo" element={<AdminPage />} />
            <Route path="/create-business" element={<CreateBusinessPage />} />
            
            {/* Public booking page */}
            <Route path="/reservas" element={<BookingPage />} />
            <Route path="/:slug/reservas" element={<BookingPage />} />
            
            {/* Shop - public */}
            <Route path="/tienda" element={<ShopPage />} />
            <Route path="/:slug/tienda" element={<ShopPage />} />
            
            {/* Bio - public */}
            <Route path="/:slug/bio" element={<BioPage />} />
            
            {/* Landing page - catch-all: / or /:slug */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/:slug" element={<LandingPage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </BusinessProvider>
  );
}

export default App;
