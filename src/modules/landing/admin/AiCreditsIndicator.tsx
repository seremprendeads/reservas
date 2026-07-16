import { useEffect, useState } from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { Progress } from '../../../components/ui/progress';
import { supabase } from '../../../lib/supabase';
import { LOW_CREDITS_THRESHOLD } from '../config';

interface Props {
  businessId: string;
  onNoCredits?: () => void;
}

function aiInvoke(fnName: string) {
  const token = sessionStorage.getItem('admin_token') || '';
  return supabase.functions.invoke(fnName, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function AiCreditsIndicator({ businessId, onNoCredits }: Props) {
  const [credits, setCredits] = useState<{ total: number; used: number; remaining: number } | null>(null);

  useEffect(() => {
    if (!businessId) return;

    aiInvoke('ai-credits').then(({ data }) => {
      if (data) {
        setCredits({
          total: data.credits_total || 15,
          used: data.credits_used || 0,
          remaining: data.credits_remaining ?? (data.credits_total - data.credits_used),
        });
      }
    }).catch(() => {
      setCredits({ total: 15, used: 0, remaining: 15 });
    });
  }, [businessId]);

  if (!credits) return null;

  const percentage = Math.round((credits.used / credits.total) * 100);
  const isLow = credits.remaining <= LOW_CREDITS_THRESHOLD && credits.remaining > 0;
  const isEmpty = credits.remaining <= 0;

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      isEmpty ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
      : isLow ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
      : 'border-border bg-card'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          isEmpty ? 'bg-red-100 dark:bg-red-900/50'
          : isLow ? 'bg-amber-100 dark:bg-amber-900/50'
          : 'bg-primary/10'
        }`}>
          <Sparkles className={`h-4 w-4 ${
            isEmpty ? 'text-red-600 dark:text-red-400'
            : isLow ? 'text-amber-600 dark:text-amber-400'
            : 'text-primary'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold font-display">Créditos IA</p>
          <p className="text-xs text-muted-foreground">
            {credits.remaining} / {credits.total} disponibles
          </p>
        </div>
        {isLow && !isEmpty && (
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
        )}
      </div>

      <Progress
        value={credits.used}
        max={credits.total}
        className={`h-1.5 ${
          isEmpty ? '[&>div]:bg-red-500'
          : isLow ? '[&>div]:bg-amber-500'
          : '[&>div]:bg-primary'
        }`}
      />

      {isLow && !isEmpty && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
          ⚠️ Te quedan pocos créditos IA. Actualizá tu plan para seguir generando contenido.
        </p>
      )}

      {isEmpty && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
          No te quedan créditos IA. Podés seguir editando manualmente.
        </p>
      )}
    </div>
  );
}
