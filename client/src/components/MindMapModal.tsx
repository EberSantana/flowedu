import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Loader2,
  Network,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

interface MindMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: number;
  subjectName: string;
}

interface MindMapNode {
  id: string;
  label: string;
  description?: string;
  color?: string;
  keywords?: string[];
  children?: MindMapNode[];
}

interface MindMapData {
  title: string;
  description: string;
  nodes: MindMapNode[];
  connections?: Array<{ from: string; to: string; label?: string }>;
}

export default function MindMapModal({
  isOpen,
  onClose,
  subjectId,
  subjectName,
}: MindMapModalProps) {
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const [zoom, setZoom] = useState(1);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const generateMindMapMutation = trpc.learningPath.generateMindMap.useMutation({
    onSuccess: (data) => {
      setMindMapData(data as MindMapData);
      // Expand all nodes by default
      const allNodeIds = new Set<string>();
      const collectIds = (nodes: MindMapNode[]) => {
        nodes.forEach((node) => {
          allNodeIds.add(node.id);
          if (node.children) collectIds(node.children);
        });
      };
      if (data.nodes) collectIds(data.nodes as MindMapNode[]);
      setExpandedNodes(allNodeIds);
      toast.success("Mapa mental gerado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar mapa mental: " + error.message);
    },
  });

  useEffect(() => {
    if (isOpen && !mindMapData) {
      generateMindMapMutation.mutate({ subjectId });
    }
  }, [isOpen, subjectId]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));
  const handleResetZoom = () => setZoom(1);

  const handleClose = () => {
    setMindMapData(null);
    setZoom(1);
    onClose();
  };

  const handleRegenerate = () => {
    setMindMapData(null);
    generateMindMapMutation.mutate({ subjectId });
  };

  const getNodeColor = (color?: string, depth: number = 0) => {
    if (color) return color;
    const colors = [
      "#3b82f6", // blue
      "#10b981", // green
      "#f59e0b", // amber
      "#ef4444", // red
      "#8b5cf6", // violet
      "#ec4899", // pink
    ];
    return colors[depth % colors.length];
  };

  const renderNode = (node: MindMapNode, depth: number = 0, isLast: boolean = true) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const nodeColor = getNodeColor(node.color, depth);

    return (
      <div key={node.id} className="relative">
        <div className="flex items-start gap-2">
          {/* Connector line */}
          {depth > 0 && (
            <div className="flex items-center">
              <div 
                className="w-6 h-px" 
                style={{ backgroundColor: nodeColor }}
              />
            </div>
          )}
          
          {/* Node content */}
          <div
            className={`flex-1 rounded-lg p-3 border-2 transition-all cursor-pointer hover:shadow-md ${
              depth === 0 ? "bg-gradient-to-r from-purple-50 to-blue-50" : "bg-white"
            }`}
            style={{ borderColor: nodeColor }}
            onClick={() => hasChildren && toggleNode(node.id)}
          >
            <div className="flex items-center gap-2">
              {hasChildren && (
                <span className="text-xs font-bold" style={{ color: nodeColor }}>
                  {isExpanded ? "−" : "+"}
                </span>
              )}
              <span 
                className={`font-semibold ${depth === 0 ? "text-lg" : "text-sm"}`}
                style={{ color: depth === 0 ? nodeColor : undefined }}
              >
                {node.label}
              </span>
            </div>
            
            {node.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {node.description}
              </p>
            )}
            
            {node.keywords && node.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {node.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: `${nodeColor}20`,
                      color: nodeColor 
                    }}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-8 mt-2 space-y-2 relative">
            {/* Vertical connector line */}
            <div 
              className="absolute left-0 top-0 w-px h-full -ml-4"
              style={{ backgroundColor: `${nodeColor}40` }}
            />
            {node.children!.map((child, idx) => 
              renderNode(child, depth + 1, idx === node.children!.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-blue-600" />
            Mapa Mental - {subjectName}
          </DialogTitle>
        </DialogHeader>

        {generateMindMapMutation.isPending ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-muted-foreground">Gerando mapa mental com IA...</p>
              <p className="text-sm text-muted-foreground mt-1">Isso pode levar alguns segundos</p>
            </div>
          </div>
        ) : mindMapData ? (
          <>
            {/* Zoom controls */}
            <div className="flex items-center justify-between border-b pb-2">
              <div className="text-sm text-muted-foreground">
                {mindMapData.description}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleResetZoom}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mind map content */}
            <ScrollArea className="flex-1">
              <div 
                ref={containerRef}
                className="p-6 min-h-[400px]"
                style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
              >
                {/* Central title */}
                <div className="text-center mb-8">
                  <div className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full text-xl font-bold shadow-lg">
                    {mindMapData.title}
                  </div>
                </div>

                {/* Nodes */}
                <div className="space-y-4">
                  {mindMapData.nodes.map((node, idx) => 
                    renderNode(node, 0, idx === mindMapData.nodes.length - 1)
                  )}
                </div>

                {/* Connections info */}
                {mindMapData.connections && mindMapData.connections.length > 0 && (
                  <div className="mt-8 pt-4 border-t">
                    <h4 className="font-semibold text-sm mb-2">Conexões entre módulos:</h4>
                    <div className="flex flex-wrap gap-2">
                      {mindMapData.connections.map((conn, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {conn.from} → {conn.to}
                          {conn.label && `: ${conn.label}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <Network className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum mapa mental gerado</p>
            </div>
          </div>
        )}

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          {mindMapData && (
            <Button variant="outline" onClick={handleRegenerate}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Regenerar
            </Button>
          )}
          <Button onClick={handleClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
