import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, Bug, BookOpen } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleReportError = () => {
    const errorDetails = {
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };
    
    // Copy error details to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
    alert("Detalhes do erro copiados para a área de transferência!");
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold">
                <span className="text-white">Flow</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Edu</span>
              </span>
            </div>

            {/* Error Icon */}
            <div className="relative mb-6">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-16 h-16 text-red-400" />
              </div>
            </div>

            {/* Message */}
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Algo deu errado
            </h2>
            
            <p className="text-gray-400 text-lg mb-4 max-w-md mx-auto">
              Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.
            </p>

            {/* Error details (collapsed by default) */}
            {this.state.error && (
              <details className="mb-8 text-left bg-white/5 rounded-xl p-4 max-w-lg mx-auto">
                <summary className="text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
                  Ver detalhes técnicos
                </summary>
                <div className="mt-4 p-3 bg-black/30 rounded-lg overflow-auto max-h-40">
                  <code className="text-red-300 text-sm whitespace-pre-wrap break-all">
                    {this.state.error.message}
                  </code>
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 px-6 py-3 rounded-xl transition-all duration-300"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Tentar Novamente
              </Button>
              
              <Button
                onClick={this.handleGoHome}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25"
              >
                <Home className="w-5 h-5 mr-2" />
                Ir para o Início
              </Button>
            </div>

            {/* Report button */}
            <button
              onClick={this.handleReportError}
              className="mt-6 text-gray-500 hover:text-gray-400 text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
            >
              <Bug className="w-4 h-4" />
              Copiar detalhes do erro
            </button>

            {/* Help text */}
            <p className="text-gray-500 text-sm mt-8">
              Se o problema persistir, entre em contato com o suporte.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
