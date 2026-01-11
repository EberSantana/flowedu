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
  BarChart3,
  Download,
  RefreshCw,
} from "lucide-react";

interface InfographicModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: number;
  subjectName: string;
}

interface InfographicData {
  title: string;
  subtitle: string;
  modules: Array<{
    title: string;
    description: string;
    topics: string[];
    color: string;
    icon: string;
  }>;
  stats: {
    totalModules: number;
    totalTopics: number;
    estimatedHours: number;
  };
}

export default function InfographicModal({
  isOpen,
  onClose,
  subjectId,
  subjectName,
}: InfographicModalProps) {
  const [infographicData, setInfographicData] = useState<InfographicData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateInfographicMutation = trpc.learningPath.generateVisualInfographic.useMutation({
    onSuccess: (data) => {
      setInfographicData(data as InfographicData);
      toast.success("Infográfico gerado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar infográfico: " + error.message);
    },
  });

  useEffect(() => {
    if (isOpen && !infographicData) {
      generateInfographicMutation.mutate({ subjectId });
    }
  }, [isOpen, subjectId]);

  useEffect(() => {
    if (infographicData && canvasRef.current) {
      drawInfographic();
    }
  }, [infographicData]);

  const drawInfographic = () => {
    const canvas = canvasRef.current;
    if (!canvas || !infographicData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Configurar canvas
    canvas.width = 1200;
    canvas.height = 1600;

    // Fundo gradiente
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#f0f9ff");
    gradient.addColorStop(1, "#e0f2fe");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let yPos = 60;

    // Título principal
    ctx.fillStyle = "#0c4a6e";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText(infographicData.title, canvas.width / 2, yPos);
    yPos += 50;

    // Subtítulo
    ctx.fillStyle = "#475569";
    ctx.font = "24px Arial";
    ctx.fillText(infographicData.subtitle, canvas.width / 2, yPos);
    yPos += 80;

    // Estatísticas (3 cards no topo)
    const stats = [
      { label: "Módulos", value: infographicData.stats.totalModules, color: "#3b82f6" },
      { label: "Tópicos", value: infographicData.stats.totalTopics, color: "#10b981" },
      { label: "Horas", value: infographicData.stats.estimatedHours, color: "#f59e0b" },
    ];

    const cardWidth = 300;
    const cardHeight = 120;
    const cardSpacing = 50;
    const startX = (canvas.width - (cardWidth * 3 + cardSpacing * 2)) / 2;

    stats.forEach((stat, idx) => {
      const x = startX + idx * (cardWidth + cardSpacing);
      
      // Card com sombra
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
      
      // Fundo do card
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(x, yPos, cardWidth, cardHeight, 15);
      ctx.fill();
      
      // Borda colorida no topo
      ctx.fillStyle = stat.color;
      ctx.beginPath();
      ctx.roundRect(x, yPos, cardWidth, 8, [15, 15, 0, 0]);
      ctx.fill();
      
      // Resetar sombra
      ctx.shadowColor = "transparent";
      
      // Valor
      ctx.fillStyle = stat.color;
      ctx.font = "bold 56px Arial";
      ctx.textAlign = "center";
      ctx.fillText(stat.value.toString(), x + cardWidth / 2, yPos + 70);
      
      // Label
      ctx.fillStyle = "#64748b";
      ctx.font = "20px Arial";
      ctx.fillText(stat.label, x + cardWidth / 2, yPos + 105);
    });

    yPos += cardHeight + 80;

    // Módulos (timeline vertical)
    infographicData.modules.forEach((module, idx) => {
      const moduleHeight = 180 + module.topics.length * 35;
      
      // Linha do tempo (esquerda)
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(100, yPos);
      ctx.lineTo(100, yPos + moduleHeight);
      ctx.stroke();
      
      // Círculo numerado
      ctx.fillStyle = module.color;
      ctx.beginPath();
      ctx.arc(100, yPos + 40, 30, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Arial";
      ctx.textAlign = "center";
      ctx.fillText((idx + 1).toString(), 100, yPos + 50);
      
      // Card do módulo
      const cardX = 160;
      const cardY = yPos;
      const cardW = canvas.width - 220;
      const cardH = moduleHeight - 40;
      
      // Sombra
      ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 5;
      
      // Fundo
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 12);
      ctx.fill();
      
      // Borda lateral colorida
      ctx.fillStyle = module.color;
      ctx.fillRect(cardX, cardY + 12, 6, cardH - 24);
      
      ctx.shadowColor = "transparent";
      
      // Ícone emoji
      ctx.font = "40px Arial";
      ctx.fillText(module.icon, cardX + 50, cardY + 50);
      
      // Título do módulo
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 28px Arial";
      ctx.textAlign = "left";
      ctx.fillText(module.title, cardX + 100, cardY + 50);
      
      // Descrição
      ctx.fillStyle = "#64748b";
      ctx.font = "18px Arial";
      const words = module.description.split(" ");
      let line = "";
      let lineY = cardY + 85;
      
      words.forEach((word) => {
        const testLine = line + word + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > cardW - 140 && line !== "") {
          ctx.fillText(line, cardX + 100, lineY);
          line = word + " ";
          lineY += 25;
        } else {
          line = testLine;
        }
      });
      ctx.fillText(line, cardX + 100, lineY);
      lineY += 35;
      
      // Tópicos (bullets)
      ctx.fillStyle = "#475569";
      ctx.font = "16px Arial";
      module.topics.forEach((topic, topicIdx) => {
        // Bullet
        ctx.fillStyle = module.color;
        ctx.beginPath();
        ctx.arc(cardX + 110, lineY - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Texto do tópico
        ctx.fillStyle = "#475569";
        ctx.fillText(topic, cardX + 125, lineY);
        lineY += 30;
      });
      
      yPos += moduleHeight + 20;
    });

    // Rodapé
    yPos += 40;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Gerado automaticamente pelo Sistema de Gestão Educacional", canvas.width / 2, yPos);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement("a");
    link.download = `infografico_${subjectName.replace(/[^a-z0-9]/gi, "_")}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    toast.success("Infográfico baixado com sucesso!");
  };

  const handleRegenerate = () => {
    setInfographicData(null);
    generateInfographicMutation.mutate({ subjectId });
  };

  const handleClose = () => {
    setInfographicData(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Infográfico Visual - {subjectName}
          </DialogTitle>
        </DialogHeader>

        {generateInfographicMutation.isPending ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-muted-foreground">Gerando infográfico...</p>
              <p className="text-sm text-muted-foreground mt-1">Isso pode levar alguns segundos</p>
            </div>
          </div>
        ) : infographicData ? (
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
