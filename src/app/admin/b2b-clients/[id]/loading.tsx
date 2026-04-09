"use client";

export default function ProfileLoading() {
    return (
        <div className="shimmer-container">
            <div className="header-shimmer">
                <div className="back-box shim"></div>
                <div className="profile-box shim"></div>
            </div>

            <div className="stats-shimmer">
                <div className="stat-box shim"></div>
                <div className="stat-box shim"></div>
                <div className="stat-box shim"></div>
            </div>

            <div className="tabs-shimmer">
                <div className="tab shim"></div>
                <div className="tab shim"></div>
                <div className="tab shim"></div>
            </div>

            <div className="content-shimmer shim"></div>

            <style jsx>{`
                .shimmer-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
                .shim { background: #f1f5f9; position: relative; overflow: hidden; border-radius: 12px; }
                .shim::after { content: ""; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent); animation: shimmer 1.5s infinite; }
                @keyframes shimmer { 100% { transform: translateX(100%); } }

                .header-shimmer { display: flex; gap: 1rem; margin-bottom: 2.5rem; }
                .back-box { width: 44px; height: 44px; border-radius: 14px; }
                .profile-box { flex: 1; height: 64px; border-radius: 18px; max-width: 300px; }

                .stats-shimmer { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2.5rem; }
                .stat-box { height: 100px; border-radius: 24px; }

                .tabs-shimmer { display: flex; gap: 0.5rem; margin-bottom: 2rem; }
                .tab { width: 140px; height: 40px; border-radius: 12px; }

                .content-shimmer { height: 400px; border-radius: 24px; }

                @media (max-width: 768px) {
                    .stats-shimmer { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}
