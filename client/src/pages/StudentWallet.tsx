import { trpc } from "@/lib/trpc";
import StudentLayout from "@/components/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  Gift,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StudentWallet() {
  const { data: wallet, isLoading: walletLoading } = trpc.studentWallet.getWallet.useQuery();
  const { data: transactions, isLoading: transactionsLoading } = trpc.studentWallet.getTransactionHistory.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.studentWallet.getWalletStats.useQuery();

  const [filterType, setFilterType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtrar transações
  const filteredTransactions = transactions?.filter((t: any) => {
    if (filterType === "all") return true;
    return t.type === filterType;
  }) || [];

  // Paginação
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (walletLoading || transactionsLoading || statsLoading) {
    return (
      <StudentLayout>
        <div className="container mx-auto py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earn': return <ArrowUpCircle className="h-5 w-5 text-green-600" />;
      case 'spend': return <ArrowDownCircle className="h-5 w-5 text-red-600" />;
      case 'bonus': return <Gift className="h-5 w-5 text-purple-600" />;
      case 'penalty': return <AlertCircle className="h-5 w-5 text-orange-600" />;
      default: return <Coins className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earn': return 'text-green-600';
      case 'spend': return 'text-red-600';
      case 'bonus': return 'text-purple-600';
      case 'penalty': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getTransactionSign = (type: string) => {
    return (type === 'earn' || type === 'bonus') ? '+' : '-';
  };

  return (
    <StudentLayout>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">💰 Minha Carteira</h1>
            <p className="text-gray-600 mt-1">Gerencie seus Tech Coins e acompanhe suas transações</p>
          </div>
        </div>

        {/* Saldo Principal */}
        <Card className="bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 text-white border-0 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium mb-2">Saldo Atual</p>
                <div className="flex items-center gap-3">
                  <Coins className="h-10 w-10 text-white animate-pulse" />
                  <span className="text-5xl font-bold">{wallet?.techCoins || 0}</span>
                  <span className="text-2xl font-semibold">Tech Coins</span>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-yellow-100 text-xs">Total Ganho</p>
                  <p className="text-xl font-bold">{wallet?.totalEarned || 0}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-yellow-100 text-xs">Total Gasto</p>
                  <p className="text-xl font-bold">{wallet?.totalSpent || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Média Diária
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {stats?.averageDaily?.toFixed(1) || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Tech Coins/dia</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4" />
                Maior Ganho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                +{stats?.maxEarned || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">em uma transação</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4" />
                Maior Gasto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                -{stats?.maxSpent || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">em uma transação</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Transações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">
                {transactions?.length || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">total de movimentações</p>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Transações */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Histórico de Transações
              </CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="earn">Ganhos</SelectItem>
                    <SelectItem value="spend">Gastos</SelectItem>
                    <SelectItem value="bonus">Bônus</SelectItem>
                    <SelectItem value="penalty">Penalidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paginatedTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Coins className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Nenhuma transação encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedTransactions.map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-full">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getTransactionColor(transaction.type)}`}>
                        {getTransactionSign(transaction.type)}{transaction.amount}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {transaction.type === 'earn' && 'Ganho'}
                        {transaction.type === 'spend' && 'Gasto'}
                        {transaction.type === 'bonus' && 'Bônus'}
                        {transaction.type === 'penalty' && 'Penalidade'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
