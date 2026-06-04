import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { trackGlitch } from "../lib/analytics";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidMount() {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const now = Date.now();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes("trace")) {
            const item = localStorage.getItem(key);
            if (item) {
              try {
                const parsed = JSON.parse(item);
                if (
                  parsed &&
                  parsed.timestamp &&
                  now - parsed.timestamp > TWENTY_FOUR_HOURS
                ) {
                  localStorage.removeItem(key);
                  i--; // Adjust index since we removed an item
                }
              } catch (e) {
                // If it's not valid JSON, we don't know the timestamp, leave it or log
              }
            }
          }
        }
      } catch (err) {
        // Silently swallow cache flush errors
      }
    }
  }

  public componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    trackGlitch(error, "GlobalErrorBoundary");

    // Prevent search engines from indexing error pages
    if (typeof document !== "undefined") {
      const meta = document.createElement("meta");
      meta.name = "robots";
      meta.content = "noindex";
      document.head.appendChild(meta);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="max-w-md w-full glass-card p-8 text-center space-y-6 animate-fade-in">
              <div className="size-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="text-red-500" size={40} />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-text-main">
                  Something went wrong
                </h1>
                <p className="text-text-muted">
                  We've encountered an unexpected error. Don't worry, your
                  progress is safe.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all"
                >
                  <RefreshCw size={18} />
                  Try Refreshing
                </button>

                <button
                  type="button"
                  onClick={this.handleReset}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-surface border border-border text-text-main font-medium rounded-xl hover:bg-white/5 transition-all"
                >
                  <Home size={18} />
                  Back to Dashboard
                </button>
              </div>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="mt-6 p-4 bg-black/40 rounded-lg text-left overflow-auto max-h-40">
                  <p className="text-xs font-mono text-red-400 whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
