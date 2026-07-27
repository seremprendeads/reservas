import { CheckCircle, Trash2, Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';

interface AdminModalsProps {
  successModal: { open: boolean; message: string };
  onSuccessClose: () => void;
  confirmModal: { open: boolean; message: string; onConfirm: () => void };
  onConfirmClose: () => void;
  trialWarningOpen: boolean;
  onTrialWarningClose: () => void;
  trialDaysLeft: number | null;
  trialCountdown: { days: number; hours: number; minutes: number; seconds: number };
}

export function AdminModals({
  successModal,
  onSuccessClose,
  confirmModal,
  onConfirmClose,
  trialWarningOpen,
  onTrialWarningClose,
  trialDaysLeft,
  trialCountdown,
}: AdminModalsProps) {
  return (
    <>
      {/* Success Modal */}
      <Dialog open={successModal.open} onOpenChange={(open) => !open && onSuccessClose()}>
        <DialogContent className="sm:max-w-md rounded-2xl p-8">
          <DialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
              <CheckCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <DialogTitle className="text-center pt-4 font-display">¡Listo!</DialogTitle>
            <DialogDescription className="text-center">{successModal.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={onSuccessClose} className="w-full sm:w-auto rounded-xl transition-all duration-200">
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Modal */}
      <Dialog open={confirmModal.open} onOpenChange={(open) => !open && onConfirmClose()}>
        <DialogContent className="sm:max-w-md rounded-2xl p-8">
          <DialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-7 w-7 text-destructive" />
            </div>
            <DialogTitle className="text-center pt-4 font-display">Eliminar reserva</DialogTitle>
            <DialogDescription className="text-center">{confirmModal.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-3">
            <Button onClick={onConfirmClose} variant="outline" className="rounded-xl transition-all duration-200">
              Cancelar
            </Button>
            <Button onClick={confirmModal.onConfirm} variant="destructive" className="rounded-xl transition-all duration-200">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trial Warning Popup */}
      <Dialog open={trialWarningOpen} onOpenChange={onTrialWarningClose}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 px-6 pt-8 pb-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-center pt-4 text-xl font-bold text-white font-display">
              Tu prueba está por vencer
            </DialogTitle>
          </div>
          <div className="px-6 -mt-4">
              <div className="rounded-xl bg-white dark:bg-zinc-900 border border-border/60 shadow-[0_8px_30px_rgba(0,0,0,.05)] p-4 transition-all duration-200">
              <div className="flex items-center justify-center gap-2">
                {trialDaysLeft !== null && trialDaysLeft > 0 ? (
                  [
                    { val: trialCountdown.days, label: 'Días' },
                    { val: trialCountdown.hours, label: 'Horas' },
                    { val: trialCountdown.minutes, label: 'Min' },
                    { val: trialCountdown.seconds, label: 'Seg' },
                  ].map(({ val, label }) => (
                    <div key={label} className="flex flex-col items-center">
                      <span className="text-2xl font-bold tabular-nums text-amber-600">{String(val).padStart(2, '0')}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
                    </div>
                  ))
                ) : null}
              </div>
              {trialDaysLeft !== null && trialDaysLeft > 0 && (
                <p className="text-center text-sm text-muted-foreground mt-3">
                  Actualizá tu plan para no perder acceso a tu panel y reservas.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3 py-5">
              <Button
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-[0_8px_30px_rgba(0,0,0,.05)] transition-all duration-200"
                asChild
              >
                <a href="#prices" target="_blank">Actualizar Plan</a>
              </Button>
              <Button variant="ghost" className="w-full rounded-xl text-muted-foreground hover:bg-muted/40 transition-all duration-200" onClick={onTrialWarningClose}>
                Cerrar para continuar hasta el 14
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
