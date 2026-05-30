import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const DiagnosticTest = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // This view is deprecated. Redirect to Mock Generator with diagnostic mode.
        navigate('/dashboard/mock?mode=diagnostic');
    }, [navigate]);

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-text-muted">Initializing Diagnostic Test…</div>
        </div>
    );
};
