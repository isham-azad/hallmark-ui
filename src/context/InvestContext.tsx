"use client";

import React, { createContext, useContext, useState } from "react";

interface InvestContextType {
    isInvestOpen: boolean;
    setIsInvestOpen: (open: boolean) => void;
}

const InvestContext = createContext<InvestContextType | undefined>(undefined);

export function InvestProvider({ children }: { children: React.ReactNode }) {
    const [isInvestOpen, setIsInvestOpen] = useState(false);

    return (
        <InvestContext.Provider value={{ isInvestOpen, setIsInvestOpen }}>
            {children}
        </InvestContext.Provider>
    );
}

export function useInvest() {
    const context = useContext(InvestContext);
    if (context === undefined) {
        throw new Error("useInvest must be used within an InvestProvider");
    }
    return context;
}
