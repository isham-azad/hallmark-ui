"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

export function AdminToast({ message, type, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const getIcon = () => {
        switch (type) {
            case "success": return "bi-check-circle";
            case "error": return "bi-exclamation-circle";
            default: return "bi-info-circle";
        }
    };

    return (
        <div className={`admin-toast ${type}`}>
            <div className="toast-icon">
                <i className={`bi ${getIcon()}`}></i>
            </div>
            <div className="toast-content">{message}</div>
            <button className="toast-close" onClick={onClose}>
                <i className="bi bi-x"></i>
            </button>

            <style jsx>{`
        .admin-toast {
          position: fixed;
          top: 24px;
          right: 24px;
          padding: 12px 20px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 300px;
          z-index: 9999;
          border: 1px solid #f1f5f9;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .toast-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }

        .success .toast-icon { background: #dcfce7; color: #166534; }
        .error .toast-icon { background: #fee2e2; color: #991b1b; }
        .info .toast-icon { background: #e0f2fe; color: #075985; }

        .toast-content {
          flex: 1;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1e293b;
        }

        .toast-close {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 1.25rem;
          display: flex;
        }

        .toast-close:hover {
          color: #1e293b;
        }
      `}</style>
        </div>
    );
}

export function useAdminToast() {
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = (message: string, type: ToastType = "success") => {
        setToast({ message, type });
    };

    const hideToast = () => setToast(null);

    const ToastComponent = toast ? (
        <AdminToast message={toast.message} type={toast.type} onClose={hideToast} />
    ) : null;

    return { showToast, ToastComponent };
}
