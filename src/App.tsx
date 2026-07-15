import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BookingPage } from './pages/BookingPage';
import { AdminPage } from './pages/AdminPage';
import { ShopPage } from './modules/shop/pages/ShopPage';
import { BioPage } from './modules/bio/pages/BioPage';
import { CreateBusinessPage } from './pages/CreateBusinessPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { BusinessProvider } from './contexts/BusinessContext';

function App() {
  return (
    <BusinessProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Public booking page - uses business slug from URL or default */}
            <Route path="/" element={<BookingPage />} />
            
            {/* Business-specific booking page */}
            <Route path="/:slug" element={<BookingPage />} />
            
            {/* Shop - public */}
            <Route path="/tienda" element={<ShopPage />} />
            <Route path="/:slug/tienda" element={<ShopPage />} />
            
            {/* Bio - public */}
            <Route path="/bio/:slug" element={<BioPage />} />
            
            {/* Admin panel */}
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/seremprende-entendo-administrativo" element={<AdminPage />} />
            <Route path="/create-business" element={<CreateBusinessPage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </BusinessProvider>
  );
}

export default App;
