"use client";

import { useState } from "react";

const addresses = [
    {
        id: "kerala",
        label: "Kerala",
        content: (
            <>
                <strong>Hallmark Enterprises</strong><br />
                Mannam Nagar, Pandalam<br />
                Pathanamthitta, Kerala - 689 501<br />
                India
            </>
        )
    },
    // {
    //     id: "tamilnadu",
    //     label: "Tamil Nadu",
    //     content: (
    //         <>
    //             <strong>Hallmark Enterprises</strong><br />
    //             C.Puthoor, Aralvaimozhi,<br />
    //             Kanyakumari Dist<br />
    //             Tamil Nadu - 629301
    //         </>
    //     )
    // },
    {
        id: "newdelhi",
        label: "New Delhi",
        content: (
            <>
                <strong>Hallmark Enterprises</strong><br />
                Door No : 106<br />
                Kairali, Sector - 3<br />
                Dwarka, New Delhi - 78
            </>
        )
    }
];

export default function AddressTabs({ variant = "default" }: { variant?: "default" | "footer" }) {
    const [activeTab, setActiveTab] = useState("kerala");

    return (
        <div className={`address-tabs ${variant === 'footer' ? 'address-tabs-footer' : ''}`}>
            <div className="d-flex flex-wrap gap-2 mb-3">
                {addresses.map((addr) => (
                    <button
                        key={addr.id}
                        onClick={() => setActiveTab(addr.id)}
                        className="btn border-0 py-1 px-3"
                        style={{
                            fontSize: '0.8rem',
                            borderRadius: '20px',
                            transition: 'all 0.3s ease',
                            backgroundColor: activeTab === addr.id ? '#ffc451' : (variant === 'footer' ? 'rgba(255,255,255,0.1)' : '#f8f9fa'),
                            color: activeTab === addr.id ? '#000' : (variant === 'footer' ? '#fff' : '#6c757d'),
                            fontWeight: activeTab === addr.id ? '700' : '500',
                            boxShadow: activeTab === addr.id ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        {addr.label}
                    </button>
                ))}
            </div>
            <div className="tab-content">
                <div
                    key={activeTab}
                    className="address-content"
                    style={{
                        fontSize: variant === 'footer' ? '0.9rem' : '0.95rem',
                        lineHeight: '1.6',
                        animation: 'fadeIn 0.3s ease-in-out'
                    }}
                >
                    {addresses.find(a => a.id === activeTab)?.content}
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            ` }} />
        </div>
    );
}
