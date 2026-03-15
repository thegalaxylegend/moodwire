import React from 'react';

export const GlobalLoading: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#0f172a] text-white">
            <div className="pt-20 px-6 max-w-7xl mx-auto h-screen overflow-hidden">
                <div className="mb-20 max-w-3xl mx-auto text-center">
                    <div className="h-10 w-48 bg-white/5 rounded-full mx-auto mb-6 animate-pulse" />
                    <div className="h-16 w-full bg-white/5 rounded-2xl mb-6 animate-pulse" />
                    <div className="h-8 w-2/3 bg-white/5 rounded-xl mx-auto animate-pulse" />
                </div>
                <div className="h-96 bg-white/5 rounded-3xl animate-pulse" />
            </div>
        </div>
    );
};
