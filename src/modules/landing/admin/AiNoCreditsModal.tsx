import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Bot, Palette, Type, Image, Wrench, Store, FileText, FormInput, Sparkles, Check } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const manualFeatures = [
  { icon: Palette, label: 'Colores' },
  { icon: Type, label: 'Fuentes' },
  { icon: Sparkles, label: 'Iconos' },
  { icon: Image, label: 'Imágenes' },
  { icon: Wrench, label: 'Servicios' },
  { icon: Store, label: 'Tienda' },
  { icon: FileText, label: 'Landing' },
  { icon: Bot, label: 'Bio' },
  { icon: FormInput, label: 'Formularios' },
];

export function AiNoCreditsModal({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-6 pt-8 pb-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-center pt-4 text-xl font-bold text-white font-display">
            Te quedaste sin créditos IA
          </DialogTitle>
        </div>

        <div className="px-6 -mt-4">
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-violet-200 dark:border-violet-800 shadow-lg p-5">
            <DialogDescription className="text-sm text-center text-muted-foreground mb-4">
              Ya utilizaste todos los créditos incluidos en tu plan. Podés seguir editando manualmente:
            </DialogDescription>

            <div className="grid grid-cols-3 gap-2">
              {manualFeatures.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-foreground">
                  <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                  <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-3">
            Lo único que se bloqueará será la generación de contenido mediante IA.
          </p>

          <div className="flex flex-col gap-2 py-5">
            <Button className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold" asChild>
              <a href="#prices" target="_blank">Comprar Créditos</a>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <a href="#prices" target="_blank">Actualizar Plan</a>
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={onClose}>
              Seguir editando manualmente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
