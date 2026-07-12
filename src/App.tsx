import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BookingPage } from './pages/BookingPage';
import { AdminPage } from './pages/AdminPage';
import { ShopPage } from './modules/shop/pages/ShopPage';
import { BioPage } from './modules/bio/pages/BioPage';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BookingPage />} />
          <Route path="/tienda" element={<ShopPage />} />
          <Route path="/bio/:slug" element={<BioPage />} />
          <Route path="/seremprende-entendo-administrativo" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
