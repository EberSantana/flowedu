import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, RefreshCw } from "lucide-react";
import mermaid from "mermaid";

interface Module {
  id: number;
  title: string;
  description: string;
}

interface Topic {
  id: number;
  moduleId: number;
  title: string;
}

interface FlowDiagramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectName: string;
  modules: Module[];
  topics: Topic[];
}

export default function FlowDiagramModal({
  open,
  onOpenChange,
  subjectName,
  modules,
  topics,
}: FlowDiagramModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
      },
    });
  }, []);

  // Gerar diagrama quando modal abrir
  useEffect(() => {
    if (open && containerRef.current) {
      generateDiagram();
    }
  }, [open, modules, topics]);

  const generateDiagram = async () => {
    if (!containerRef.current) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Limpar container
      containerRef.current.innerHTML = '';

      // Gerar código Mermaid
      const mermaidCode = generateMermaidCode();

      // Renderizar diagrama
      const { svg } = await mermaid.render('mermaid-diagram', mermaidCode);
      
      if (containerRef.current) {
        containerRef.current.innerHTML = svg;
      }
    } catch (err) {
      console.error('Erro ao gerar diagrama:', err);
      setError('Erro ao gerar diagrama. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMermaidCode = (): string => {
    let code = 'flowchart TD\n';
    
    // Adicionar nó raiz (disciplina)
    code += `  Start["${escapeText(subjectName)}"]\n`;
    code += '  Start:::rootStyle\n\n';

    // Adicionar módulos
    modules.forEach((module, index) => {
      const moduleId = `M${module.id}`;
      code += `  ${moduleId}["📚 ${escapeText(module.title)}"]\n`;
      
      // Conectar ao nó anterior
      if (index === 0) {
        code += `  Start --> ${moduleId}\n`;
      } else {
        code += `  M${modules[index - 1].id} --> ${moduleId}\n`;
      }

      // Adicionar tópicos do módulo
      const moduleTopics = topics.filter(t => t.moduleId === module.id);
      moduleTopics.forEach((topic, topicIndex) => {
        const topicId = `T${topic.id}`;
        code += `  ${topicId}["📝 ${escapeText(topic.title)}"]\n`;
        code += `  ${moduleId} --> ${topicId}\n`;
      });

      code += '\n';
    });

    // Adicionar estilos
    code += '  classDef rootStyle fill:#8b5cf6,stroke:#7c3aed,stroke-width:3px,color:#fff\n';
    code += '  classDef moduleStyle fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff\n';
    code += '  classDef topicStyle fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff\n';

    return code;
  };

  const escapeText = (text: string): string => {
    return text
      .replace(/"/g, '#quot;')
      .replace(/\n/g, ' ')
      .substring(0, 50);
  };

  const handleDownload = () => {
    if (!containerRef.current) return;

    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) return;

    // Converter SVG para blob
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    // Download
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagrama-${subjectName.toLowerCase().replace(/\s+/g, '-')}.svg`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Diagrama de Fluxo - {subjectName}</DialogTitle>
          <DialogDescription>
            Visualização hierárquica dos módulos e tópicos da disciplina
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isGenerating && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-3 text-gray-600">Gerando diagrama...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!isGenerating && !error && (
            <>
              <div
                ref={containerRef}
                className="border rounded-lg p-4 bg-white overflow-x-auto"
                style={{ minHeight: '400px' }}
              />

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={generateDiagram}
                  disabled={isGenerating}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerar
                </Button>
                <Button
                  onClick={handleDownload}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar SVG
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
