import { Menu, Sun, Moon } from 'lucide-react';
import { Avatar } from '../../components/ui/avatar';

interface AdminHeaderProps {
  title: string;
  onMenuClick: () => void;
  adminName: string;
  adminAvatar: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function AdminHeader({
  title,
  onMenuClick,
  adminName,
  adminAvatar,
  darkMode,
  onToggleDarkMode,
}: AdminHeaderProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-sm px-4 lg:px-8">
      {/* Menú hamburguesa: abre el menú lateral en móvil */}
      <button
        onClick={onMenuClick}
        title="Abrir menú"
        aria-label="Abrir menú"
        className="lg:hidden rounded-2xl p-2 text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors duration-200">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-3">
        <h1 className="text-xl font-display">{title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onToggleDarkMode}
          title={darkMode ? 'Modo claro' : 'Modo oscuro'}
          className="rounded-xl p-2 text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all duration-200">
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>


        <div className="flex items-center gap-2.5">
          <Avatar fallback={adminName.charAt(0).toUpperCase() || 'A'} src={adminAvatar || null} className="h-8 w-8" />
          <span className="hidden text-sm font-medium sm:block">{adminName || 'Admin'}</span>
        </div>
      </div>
    </header>
  );
}