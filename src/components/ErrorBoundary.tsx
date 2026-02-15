import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { trackGlitch } from '../lib/analytics';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        trackGlitch(error, `ErrorBoundary: ${errorInfo.componentStack?.split('\n')[1]?.trim() || 'Global'}`);
    }

    private handleReset = () => {
        window.location.href = '/';
    };

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-white font-sans">
                    <div className="max-w-md w-full bg-[#0f172a] border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>

                        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            The application encountered an unexpected error. Don't worry, our team has been notified automatically.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={this.handleReload}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-white font-semibold rounded-xl border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                            >
                                <Home className="w-4 h-4" />
                                Back to Home
                            </button>
                        </div>

                        {import.meta.env.DEV && (
                            <div className="mt-8 p-4 bg-black/40 rounded-lg text-left overflow-auto max-h-40">
                                <code className="text-xs text-red-300 font-mono">
                                    {this.state.error?.toString()}
                                </code>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
