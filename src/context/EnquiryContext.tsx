"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface EnquiryProduct {
  id: string;
  name: string;
  category?: string;
  image?: string;
}

interface EnquiryContextType {
  isEnquiryOpen: boolean;
  enquiryProduct: EnquiryProduct | null;
  openEnquiry: (product: EnquiryProduct) => void;
  closeEnquiry: () => void;
  setIsEnquiryOpen: (open: boolean) => void;
}

const EnquiryContext = createContext<EnquiryContextType | undefined>(undefined);

export function EnquiryProvider({ children }: { children: ReactNode }) {
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [enquiryProduct, setEnquiryProduct] = useState<EnquiryProduct | null>(null);

  const openEnquiry = (product: EnquiryProduct) => {
    setEnquiryProduct(product);
    setIsEnquiryOpen(true);
  };

  const closeEnquiry = () => {
    setIsEnquiryOpen(false);
  };

  return (
    <EnquiryContext.Provider
      value={{
        isEnquiryOpen,
        enquiryProduct,
        openEnquiry,
        closeEnquiry,
        setIsEnquiryOpen,
      }}
    >
      {children}
    </EnquiryContext.Provider>
  );
}

export function useEnquiry() {
  const context = useContext(EnquiryContext);
  if (context === undefined) {
    throw new Error("useEnquiry must be used within an EnquiryProvider");
  }
  return context;
}
