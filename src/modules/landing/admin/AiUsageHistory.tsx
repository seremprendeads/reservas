import { useEffect, useState } from 'react';
import { Bot, Sparkles, Wand2, HelpCircle, Search, FileText, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { AI_ACTION_LABELS, type AiUsageHistory as UsageHistoryType } from '../types';

const ACTION_ICONS: Record<string, typeof Bot> = {
  landing_generation: Sparkles,
  hero_rewrite: Wand2,
  about_rewrite: FileText,
  services_rewrite: RefreshCw,
  testimonials_generate: Bot,
  faq_generation: HelpCircle,
  seo_generation: Search,
  text_rewrite: FileText,
  section_regenerate: RefreshCw,
};

interface Props {
  businessId: string;
}

export function AiUsageHistory({ businessId }: Props) {
  const [history, setHistory] = useState<UsageHistoryType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    supabase.functions.invoke('ai-usage-history').then(({ data }) => {
      if (data?.history) setHistory(data.history);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [businessId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Aún no usaste créditos IA</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((item) => {
        const Icon = ACTION_ICONS[item.action] || Sparkles;
        const label = AI_ACTION_LABELS[item.action] || item.action;
        const date = new Date(item.created_at).toLocaleDateString('es-AR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{label}</p>
              <p className="text-xs text-muted-foreground">{date}</p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground shrink-0">
              -{item.credits_cost} crédito{item.credits_cost > 1 ? 's' : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}
