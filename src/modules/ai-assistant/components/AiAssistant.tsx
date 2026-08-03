import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useBusiness } from '../../../contexts/BusinessContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const WELCOME: Message = {
  role: 'assistant',
  content: '¡Hola! Soy BookingBot 🤖\n\nSoy tu asistente virtual de BookingBio. Puedo ayudarte con:\n\n• Configurar tu negocio (colores, logo, branding)\n• Recomendarte paletas de colores según tu rubro\n• Ayudarte con el SEO de tu landing\n• Explicarte cómo funciona cada módulo (reservas, tienda, bio, etc.)\n• Responder cualquier duda sobre la plataforma\n\n¿En qué te ayudo?',
};

export function AiAssistant() {
  const { business } = useBusiness();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError('');

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-assistant', {
        body: { messages: [...messages.slice(1), userMsg], businessId: business?.id },
      });

      if (fnError) {
        throw new Error(data?.error || fnError.message);
      }
      if (data?.error) {
        throw new Error(data.error);
      }
      if (!data?.reply) {
        throw new Error('Error al obtener respuesta');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="border-b border-border bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-left text-base">BookingBot</DialogTitle>
                <p className="text-xs text-muted-foreground font-medium">Asistente IA</p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex h-[340px] flex-col gap-3 overflow-y-auto p-5">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-accent text-foreground'
                  }`}
                >
                  {msg.content.split('\n').map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < msg.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Pensando...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {error && (
            <p className="px-5 pb-1 text-xs text-red-500">{error}</p>
          )}

          <div className="flex items-end gap-2 border-t border-border p-5">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribí tu consulta..."
              rows={1}
              className="max-h-24 min-h-[40px] flex-1 resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <button
        onClick={() => setOpen(true)}
        className="group fixed bottom-24 right-6 z-50 flex items-center gap-2"
        title="BookingBot"
      >
        <span className="hidden rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg transition-all duration-200 group-hover:block dark:bg-gray-100 dark:text-gray-900">
          BookingBot
        </span>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 transition-all duration-200 hover:scale-110 hover:shadow-xl hover:shadow-violet-500/40">
          <Bot className="h-6 w-6" />
        </span>
      </button>
    </>
  );
}
