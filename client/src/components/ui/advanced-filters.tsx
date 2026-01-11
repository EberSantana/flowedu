import * as React from "react";
import { Search, X, Filter, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";

// ========== TIPOS ==========

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  type: "text" | "select" | "multiselect" | "date" | "daterange" | "number";
  placeholder?: string;
  options?: FilterOption[];
  min?: number;
  max?: number;
}

export interface FilterValue {
  [key: string]: string | string[] | number | [Date | null, Date | null] | null;
}

interface AdvancedFiltersProps {
  filters: FilterConfig[];
  values: FilterValue;
  onChange: (values: FilterValue) => void;
  onClear?: () => void;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  showActiveCount?: boolean;
}

// ========== COMPONENTE PRINCIPAL ==========

export function AdvancedFilters({
  filters,
  values,
  onChange,
  onClear,
  className,
  collapsible = false,
  defaultExpanded = true,
  showActiveCount = true,
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  // Contar filtros ativos
  const activeFiltersCount = React.useMemo(() => {
    return Object.values(values).filter((v) => {
      if (Array.isArray(v)) return v.length > 0;
      if (v === null || v === undefined || v === "") return false;
      return true;
    }).length;
  }, [values]);

  const handleFilterChange = (filterId: string, value: any) => {
    onChange({
      ...values,
      [filterId]: value,
    });
  };

  const handleClearAll = () => {
    const clearedValues: FilterValue = {};
    filters.forEach((filter) => {
      clearedValues[filter.id] = filter.type === "multiselect" ? [] : "";
    });
    onChange(clearedValues);
    onClear?.();
  };

  const renderFilter = (filter: FilterConfig) => {
    const value = values[filter.id];

    switch (filter.type) {
      case "text":
        return (
          <div key={filter.id} className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              {filter.label}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={filter.placeholder || `Buscar ${filter.label.toLowerCase()}...`}
                value={(value as string) || ""}
                onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                className="pl-9"
              />
              {value && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => handleFilterChange(filter.id, "")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        );

      case "select":
        return (
          <div key={filter.id} className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              {filter.label}
            </label>
            <Select
              value={(value as string) || "all"}
              onValueChange={(v) => handleFilterChange(filter.id, v === "all" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={filter.placeholder || "Selecione..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "multiselect":
        const selectedValues = (value as string[]) || [];
        return (
          <div key={filter.id} className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              {filter.label}
            </label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px] bg-background">
              {selectedValues.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  {filter.placeholder || "Selecione..."}
                </span>
              ) : (
                selectedValues.map((v) => {
                  const option = filter.options?.find((o) => o.value === v);
                  return (
                    <Badge
                      key={v}
                      variant="secondary"
                      className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() =>
                        handleFilterChange(
                          filter.id,
                          selectedValues.filter((sv) => sv !== v)
                        )
                      }
                    >
                      {option?.label || v}
                      <X className="h-3 w-3" />
                    </Badge>
                  );
                })
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {filter.options
                ?.filter((o) => !selectedValues.includes(o.value))
                .map((option) => (
                  <Badge
                    key={option.value}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() =>
                      handleFilterChange(filter.id, [...selectedValues, option.value])
                    }
                  >
                    + {option.label}
                  </Badge>
                ))}
            </div>
          </div>
        );

      case "number":
        return (
          <div key={filter.id} className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              {filter.label}
            </label>
            <Input
              type="number"
              placeholder={filter.placeholder || "Digite um número..."}
              value={(value as number) || ""}
              onChange={(e) =>
                handleFilterChange(
                  filter.id,
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              min={filter.min}
              max={filter.max}
            />
          </div>
        );

      case "date":
        return (
          <div key={filter.id} className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              {filter.label}
            </label>
            <Input
              type="date"
              value={(value as string) || ""}
              onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const filterContent = (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filters.map(renderFilter)}
      </div>

      {activeFiltersCount > 0 && (
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""} ativo
              {activeFiltersCount > 1 ? "s" : ""}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );

  if (!collapsible) {
    return filterContent;
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="flex items-center justify-between mb-4">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {showActiveCount && activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>
      <CollapsibleContent>{filterContent}</CollapsibleContent>
    </Collapsible>
  );
}

// ========== COMPONENTE DE BUSCA SIMPLES ==========

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchFilter({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
}: SearchFilterProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-9"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
          onClick={() => onChange("")}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// ========== HOOK PARA GERENCIAR FILTROS ==========

export function useFilters<T extends FilterValue>(initialValues: T) {
  const [values, setValues] = React.useState<T>(initialValues);

  const updateFilter = (key: keyof T, value: T[keyof T]) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setValues(initialValues);
  };

  const hasActiveFilters = React.useMemo(() => {
    return Object.values(values).some((v) => {
      if (Array.isArray(v)) return v.length > 0;
      if (v === null || v === undefined || v === "") return false;
      return true;
    });
  }, [values]);

  return {
    values,
    setValues,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}

// ========== FUNÇÃO AUXILIAR PARA FILTRAR DADOS ==========

export function filterData<T>(
  data: T[],
  filters: FilterValue,
  filterFunctions: {
    [key: string]: (item: T, value: any) => boolean;
  }
): T[] {
  return data.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      // Ignorar filtros vazios
      if (value === null || value === undefined || value === "") return true;
      if (Array.isArray(value) && value.length === 0) return true;

      // Aplicar função de filtro se existir
      const filterFn = filterFunctions[key];
      if (filterFn) {
        return filterFn(item, value);
      }

      return true;
    });
  });
}
