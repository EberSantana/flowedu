import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

// ========== SKELETON PARA DASHBOARD ==========

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full rounded-lg" />
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ========== SKELETON PARA GRADE DE HORÁRIOS ==========

export function ScheduleGridSkeleton() {
  const days = 5; // Segunda a Sexta
  const slots = 6; // Horários por dia
  
  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header com dias da semana */}
      <div className="grid grid-cols-6 gap-2">
        <Skeleton className="h-10 w-full rounded-lg" />
        {Array.from({ length: days }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
      
      {/* Grid de horários */}
      {Array.from({ length: slots }).map((_, slotIndex) => (
        <div key={slotIndex} className="grid grid-cols-6 gap-2">
          <Skeleton className="h-20 w-full rounded-lg" />
          {Array.from({ length: days }).map((_, dayIndex) => (
            <Skeleton key={dayIndex} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ========== SKELETON PARA LISTA DE DISCIPLINAS ==========

export function SubjectsListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="bg-card overflow-hidden">
          <div className="h-2 bg-muted" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-4/5 mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ========== SKELETON PARA LISTA DE TURMAS ==========

export function ClassesListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ========== SKELETON PARA CALENDÁRIO ==========

export function CalendarSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header do calendário */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
      
      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
      
      {/* Grid do calendário */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ========== SKELETON PARA TURNOS ==========

export function ShiftsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-fade-in-up">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ========== SKELETON PARA TABELA GENÉRICA ==========

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export function TableSkeleton({ rows = 5, columns = 4, showHeader = true }: TableSkeletonProps) {
  return (
    <Card className="bg-card animate-fade-in-up">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            {showHeader && (
              <thead>
                <tr className="border-b border-border">
                  {Array.from({ length: columns }).map((_, i) => (
                    <th key={i} className="p-4 text-left">
                      <Skeleton className="h-4 w-24" />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border last:border-0">
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <td key={colIndex} className="p-4">
                      <Skeleton className="h-4 w-full max-w-[200px]" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== SKELETON PARA PERFIL ==========

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header do perfil */}
      <Card className="bg-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </CardContent>
      </Card>
      
      {/* Formulário */}
      <Card className="bg-card">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

// ========== SKELETON PARA TRILHAS DE APRENDIZAGEM ==========

export function LearningPathsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ========== SKELETON PARA FORMULÁRIO ==========

interface FormSkeletonProps {
  fields?: number;
  hasTextarea?: boolean;
}

export function FormSkeleton({ fields = 4, hasTextarea = false }: FormSkeletonProps) {
  return (
    <Card className="bg-card animate-fade-in-up">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        {hasTextarea && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        )}
        <div className="flex gap-2 pt-4">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

// ========== SKELETON PARA ESTATÍSTICAS ==========

export function StatsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Gráfico */}
      <Card className="bg-card">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

// ========== SKELETON INLINE (para botões, badges, etc) ==========

interface InlineSkeletonProps {
  className?: string;
  variant?: "text" | "button" | "badge" | "avatar" | "icon";
}

export function InlineSkeleton({ className, variant = "text" }: InlineSkeletonProps) {
  const variants = {
    text: "h-4 w-24",
    button: "h-9 w-20 rounded-lg",
    badge: "h-6 w-16 rounded-full",
    avatar: "h-10 w-10 rounded-full",
    icon: "h-5 w-5 rounded",
  };
  
  return <Skeleton className={cn(variants[variant], className)} />;
}

// ========== SKELETON PARA PÁGINA COMPLETA ==========

interface PageSkeletonProps {
  type?: "dashboard" | "list" | "form" | "table" | "calendar";
}

export function PageSkeleton({ type = "list" }: PageSkeletonProps) {
  switch (type) {
    case "dashboard":
      return <DashboardSkeleton />;
    case "form":
      return <FormSkeleton fields={6} hasTextarea />;
    case "table":
      return <TableSkeleton rows={10} columns={5} />;
    case "calendar":
      return <CalendarSkeleton />;
    default:
      return <SubjectsListSkeleton count={9} />;
  }
}
