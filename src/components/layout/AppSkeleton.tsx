import React from 'react';

interface AppSkeletonProps {
    theme: string;
    isSidebarCollapsed: boolean;
}

const AppSkeleton: React.FC<AppSkeletonProps> = ({ theme, isSidebarCollapsed }) => {
    return (
        <div className={`app-container theme-${theme} ${isSidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
            {/* Sidebar Skeleton */}
            <aside className="sidebar glass">
                <div className="sidebar-scroll-content">
                    <div className="logo-container">
                        <div className="logo-main">
                            <div className="logo-icon skeleton" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
                            {!isSidebarCollapsed && <div className="skeleton-title skeleton" style={{ width: '100px', height: '24px', marginBottom: 0, marginLeft: '0.75rem' }} />}
                        </div>
                    </div>

                    <div className="nav-section">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="nav-item skeleton" style={{ height: '44px', marginBottom: '8px', border: 'none', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start' }}>
                                {isSidebarCollapsed && <div className="skeleton" style={{ width: '20px', height: '20px' }} />}
                            </div>
                        ))}
                    </div>

                    {!isSidebarCollapsed && <div className="sidebar-divider" />}

                    {!isSidebarCollapsed && (
                        <div className="vibe-section">
                            <div className="skeleton-title skeleton" style={{ width: '60px', height: '12px', marginBottom: '1.5rem', marginLeft: '1rem' }} />
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="vibe-item skeleton" style={{ height: '44px', marginBottom: '8px', border: 'none' }} />
                            ))}
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Skeleton */}
            <main className="main-content">
                <div className="skeleton-title skeleton" style={{ width: '200px', height: '32px', marginBottom: '2.5rem' }} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2rem' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="skeleton-card skeleton" style={{ height: '300px', border: 'none', background: 'rgba(255,255,255,0.03)' }}>
                            <div className="skeleton-image skeleton" style={{ borderRadius: '12px', marginBottom: '1rem' }} />
                            <div className="skeleton-text skeleton" style={{ width: '85%', height: '16px', marginBottom: '0.75rem' }} />
                            <div className="skeleton-text skeleton" style={{ width: '60%', height: '14px' }} />
                        </div>
                    ))}
                </div>
            </main>

            {/* Player Bar Skeleton */}
            <div className="player-bar">
                <div className="current-track">
                    <div className="album-art skeleton" style={{ width: '56px', height: '56px', borderRadius: '8px' }} />
                    <div className="track-info">
                        <div className="skeleton-text skeleton" style={{ width: '120px', height: '14px', marginBottom: '6px' }} />
                        <div className="skeleton-text skeleton" style={{ width: '80px', height: '12px' }} />
                    </div>
                </div>

                <div className="player-controls">
                    <div className="control-buttons" style={{ marginBottom: '8px', gap: '1.5rem', display: 'flex' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="skeleton" style={{ width: i === 3 ? '48px' : '24px', height: i === 3 ? '48px' : '24px', borderRadius: '50%' }} />
                        ))}
                    </div>
                    <div className="progress-container">
                        <div className="skeleton" style={{ width: '100%', height: '4px', borderRadius: '2px' }} />
                    </div>
                </div>

                <div className="extra-controls" style={{ gap: '1rem', display: 'flex', alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                    <div className="skeleton" style={{ width: '100px', height: '24px', borderRadius: '12px' }} />
                </div>
            </div>
        </div>
    );
};

export default AppSkeleton;
