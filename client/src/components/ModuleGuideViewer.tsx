import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { X, BookOpen, Video, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { Streamdown } from "streamdown";

interface ModuleGuideViewerProps {
  moduleId: number;
  moduleName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ModuleGuideViewer({
  moduleId,
  moduleName = "Módulo",
  isOpen,
  onClose,
}: ModuleGuideViewerProps) {
  const [guide, setGuide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: guideData } = trpc.learningPath.getModuleGuide.useQuery(
    { moduleId },
    { enabled: isOpen }
  );

  useEffect(() => {
    if (guideData) {
      setGuide(guideData);
      setIsLoading(false);
    }
  }, [guideData]);

  const getGuideIcon = () => {
    switch (guide?.guideType) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "interactive":
        return <Zap className="w-4 h-4" />;
      case "mixed":
        return <BookOpen className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getGuideTypeLabel = () => {
    const labels: Record<string, string> = {
      text: "Texto",
      video: "Vídeo",
      interactive: "Interativo",
      mixed: "Misto",
    };
    return labels[guide?.guideType] || "Guia";
  };

  if (!guide && !isLoading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold">{moduleName}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Guia de Animação
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : guide ? (
          <div className="space-y-6 py-4">
            {/* Cabeçalho do Guia */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {getGuideIcon()}
                <Badge variant="secondary" className="gap-1">
                  {getGuideTypeLabel()}
                </Badge>
              </div>
              {guide.guideTitle && (
                <h2 className="text-lg font-semibold text-foreground">
                  {guide.guideTitle}
                </h2>
              )}
            </div>

            {/* Conteúdo do Guia */}
            {guide.guideContent && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <Streamdown>{guide.guideContent}</Streamdown>
              </div>
            )}

            {/* Botão de Fechar */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhum guia disponível para este módulo
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
