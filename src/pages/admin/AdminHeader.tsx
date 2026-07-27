import { Menu, ExternalLink } from 'lucide-react';
import { Avatar } from '../../components/ui/avatar';
import { Separator } from '../../components/ui/separator';

interface AdminHeaderProps {
  title: string;
  onMenuClick: () => void;
  adminName: string;
  adminAvatar: string;
  businessSlug?: string;
}

export function AdminHeader({
  title,
  onMenuClick,
  adminName,
  adminAvatar,
  businessSlug,
}: AdminHeaderProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-sm px-4 lg:px-8">
      <button
        onClick={onMenuClick}
        className="lg:hidden rounded-2xl p-2 text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors duration-200">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-3">
        <h1 className="text-xl font-display">{title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <a
          href={`/${businessSlug || '...'}/reservas`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-muted/40 hover:text-foreground">
          <ExternalLink className="h-4 w-4" />
          <span>Página de Reservas</span>
        </a>

        <Separator orientation="vertical" className="h-8 hidden sm:block" />

        <div className="flex items-center gap-2.5">
          <Avatar fallback={adminName.charAt(0).toUpperCase() || 'A'} src={adminAvatar || null} className="h-8 w-8" />
          <span className="hidden text-sm font-medium sm:block">{adminName || 'Admin'}</span>
        </div>
      </div>
    </header>
  );
}
