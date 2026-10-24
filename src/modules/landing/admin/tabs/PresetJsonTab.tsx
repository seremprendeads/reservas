import { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { CheckCircle, AlertTriangle, FileJson } from 'lucide-react';
import type { LandingSections, LandingTheme } from '../../types';

interface PresetJsonTabProps {
  sections: LandingSections;
  theme: LandingTheme;
  template: string;
  setTemplate: (v: string) => void;
  setSections: (v: LandingSections) => void;
  setTheme: (v: LandingTheme) => void;
  setVisibleSections: (v: string[]) => void;
  visibleSections: string[];
}

export function PresetJsonTab({
  sections,
  theme,
  template,
  setTemplate,
  setSections,
  setTheme,
  setVisibleSections,
  visibleSections,
}: PresetJsonTabProps) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [applying, setApplying] = useState(false);

  const hasExistingContent = () => {
    const hasSections = sections && Object.keys(sections).length > 0;
    const hasTheme = theme && Object.keys(theme).length > 0;
    const hasVisible = visibleSections && visibleSections.length > 0;
    return hasSections || hasTheme || hasVisible;
  };

  const handleApply = () => {
    setError('');
    setSuccess('');
    
    if (!jsonText.trim()) {
      setError('Pegá el JSON primero');
      return;
    }

    if (hasExistingContent()) {
      const confirmReplace = window.confirm('Ya hay contenido en esta landing. ¿Querés reemplazarlo con esta plantilla JSON?');
      if (!confirmReplace) return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      
      if (!parsed.template && !parsed.sections && !parsed.theme) {
        setError('El JSON debe tener al menos template, sections, theme o visible_sections');
        return;
      }

      setApplying(true);

      if (parsed.template) {
        setTemplate(parsed.template);
      }
      if (parsed.sections) {
        setSections(parsed.sections);
      }
      if (parsed.theme) {
        setTheme(parsed.theme);
      }
      if (parsed.visible_sections) {
        setVisibleSections(parsed.visible_sections);
      }

      setSuccess('Plantilla aplicada correctamente. Ya podés guardar desde el constructor.');
      setJsonText('');
    } catch (e) {
      setError('JSON inválido. Revisá el formato.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileJson className="h-5 w-5 text-primary" />
          <h3 className="text-base font-medium text-foreground">Plantilla JSON</h3>
        </div>
        <p className="text-sm text-foreground/60">
          Pegá solo el JSON con <code className="text-xs bg-muted px-1 py-0.5 rounded">template</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">sections</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">theme</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">visible_sections</code>. 
          Se aplica únicamente a esta landing.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-emerald-500 bg-emerald-50 text-emerald-700">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">JSON de plantilla</label>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='{\n  "template": "legal",\n  "sections": {...},\n  "theme": {...},\n  "visible_sections": ["header", "hero", ...]\n}'
          rows={20}
          className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
        />
      </div>

      <Button onClick={handleApply} disabled={applying} className="w-full">
        {applying ? 'Aplicando...' : 'Aplicar a esta landing'}
      </Button>

      <div className="text-xs text-foreground/50 space-y-1">
        <p>• Solo afecta esta landing, no a otros negocios</p>
        <p>• El cliente podrá modificar textos, imágenes, equipo, FAQ, etc. desde las otras pestañas</p>
        <p>• Después de aplicar, guardá desde el constructor normal</p>
      </div>
    </div>
  );
}
