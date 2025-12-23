import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Loader2,
  Network,
  Download,
  RefreshCw,
} from "lucide-react";

interface ModuleMindMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: number;
  moduleTitle: string;
}

interface MindMapData {
  title: string;
  description: string;
  nodes: Array<{
    id: string;
    label: string;
    description: string;
    color: string;
    children?: Array<{
      id: string;
      label: string;
      description: string;
    }>;
  }>;
}

export default function ModuleMindMapModal({
  isOpen,
  onClose,
  moduleId,
  moduleTitle,
}: ModuleMindMapModalProps) {
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateMindMapMutation = trpc.learningPath.generateModuleMindMap.useMutation({
    onSuccess: (data: any) => {
      setMindMapData(data as MindMapData);
      toast.success("Mapa mental gerado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao gerar mapa mental: " + error.message);
    },
  });

  useEffect(() => {
    if (isOpen && !mindMapData) {
      generateMindMapMutation.mutate({ moduleId });
    }
  }, [isOpen, moduleId]);

  useEffect(() => {
    if (mindMapData && canvasRef.current) {
      drawMindMap();
    }
  }, [mindMapData]);

  const drawMindMap = () => {
    const canvas = canvasRef.current;
    if (!canvas || !mindMapData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Configurar canvas
    canvas.width = 1000;
    canvas.height = 800;

    // Fundo gradiente
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#f8fafc");
    gradient.addColorStop(1, "#e2e8f0");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Centro do canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Desenhar nó central (título do módulo)
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 120, 60, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Quebrar título se muito longo
    const titleWords = mindMapData.title.split(" ");
    let line1 = "";
    let line2 = "";
    titleWords.forEach((word, i) => {
      if (i < titleWords.length / 2) {
        line1 += word + " ";
      } else {
        line2 += word + " ";
      }
    });
    ctx.fillText(line1.trim(), centerX, centerY - 12);
    ctx.fillText(line2.trim(), centerX, centerY + 12);

    // Desenhar nós filhos (tópicos)
    const nodes = mindMapData.nodes || [];
    const angleStep = (Math.PI * 2) / Math.max(nodes.length, 1);
    const radius = 280;

    nodes.forEach((node, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Linha conectora
      ctx.strokeStyle = node.color || "#94a3b8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Nó do tópico
      ctx.fillStyle = node.color || "#10b981";
      ctx.beginPath();
      ctx.ellipse(x, y, 90, 45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Texto do nó
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px Arial";
      const label = node.label.length > 20 ? node.label.substring(0, 20) + "..." : node.label;
      ctx.fillText(label, x, y);

      // Desenhar sub-nós (children)
      if (node.children && node.children.length > 0) {
        const childRadius = 100;
        const childAngleStep = (Math.PI / 3) / Math.max(node.children.length - 1, 1);
        const startAngle = angle - Math.PI / 6;

        node.children.slice(0, 3).forEach((child, childIndex) => {
          const childAngle = startAngle + childAngleStep * childIndex;
          const childX = x + Math.cos(childAngle) * childRadius;
          const childY = y + Math.sin(childAngle) * childRadius;

          // Linha conectora
          ctx.strokeStyle = "#cbd5e1";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(childX, childY);
          ctx.stroke();

          // Nó filho
          ctx.fillStyle = "#f1f5f9";
          ctx.strokeStyle = node.color || "#94a3b8";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(childX, childY, 60, 30, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Texto do nó filho
          ctx.fillStyle = "#334155";
          ctx.font = "12px Arial";
          const childLabel = child.label.length > 15 ? child.label.substring(0, 15) + "..." : child.label;
          ctx.fillText(childLabel, childX, childY);
        });
      }
    });

    // Rodapé
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Mapa Mental - " + moduleTitle, canvas.width / 2, canvas.height - 20);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement("a");
    link.download = `mapa_mental_${moduleTitle.replace(/[^a-z0-9]/gi, "_")}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    toast.success("Mapa mental baixado com sucesso!");
  };

  const handleRegenerate = () => {
    setMindMapData(null);
    generateMindMapMutation.mutate({ moduleId });
  };

  const handleClose = () => {
    setMindMapData(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-blue-600" />
            Mapa Mental - {moduleTitle}
          </DialogTitle>
        </DialogHeader>

        {generateMindMapMutation.isPending ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-muted-foreground">Gerando mapa mental...</p>
              <p className="text-sm text-muted-foreground mt-1">Isso pode levar alguns segundos</p>
            </div>
          </div>
        ) : mindMapData ? (
          <>
            <ScrollArea className="flex-1">
              <div className="flex justify-center p-4">
                <canvas
                  ref={canvasRef}
                  className="border rounded-lg shadow-lg max-w-full h-auto"
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
            </ScrollArea>

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={handleRegenerate}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Gerar Novamente
              </Button>
              <Button variant="outline" onClick={handleDownload} className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                <Download className="h-4 w-4 mr-2" />
                Baixar PNG
              </Button>
              <Button onClick={handleClose}>
                Fechar
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
