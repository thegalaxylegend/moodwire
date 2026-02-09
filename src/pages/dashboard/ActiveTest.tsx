import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const ActiveTest = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // This view is deprecated. Redirect to Test Center which now uses MockGenerator via its own logic.
        navigate('/dashboard/test-center');
    }, [navigate]);

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-text-muted">Redirecting to Test Center...</div>
        </div>
    );
};
