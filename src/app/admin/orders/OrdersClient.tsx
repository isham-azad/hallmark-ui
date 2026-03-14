"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { updateOrderStatus, updatePayment, sendOrderDeliveryOtp, verifyOrderDeliveryOtp } from "./actions";
import { useAdminToast } from "@/components/AdminToast";
import UPIQrCode from "@/components/UPIQrCode";
import { parseOrderTotal } from "@/lib/upi";
import { PERMISSIONS } from "@/lib/permissions";
import { getRolePermissionsMap } from "../staff/roles/permissions-map";

const PAGE_SIZE = 10;

interface OrderItem {
    id: string;
    name: string;
    sku: string | null;
    qty: number;
    price: string;
}

interface Order {
    id: string;
    orderNo: string;
    customer: string;
    email: string;
    phone?: string | null;
    date: string;
    total: string;
    status: string;
    payment: string;
    paymentMethod?: string;
    paymentStatus?: string;
    items: OrderItem[];
}

interface OrdersClientProps {
    initialOrders: Order[];
}

export default function OrdersClient({ initialOrders }: OrdersClientProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [newStatus, setNewStatus] = useState("");
    const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
    const [newPaymentMethod, setNewPaymentMethod] = useState<"COD" | "UPI">("UPI");
    const [newPaymentStatus, setNewPaymentStatus] = useState<"Pending" | "Paid">("Pending");
    const [qrOrder, setQrOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [canExport, setCanExport] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
    const { showToast, ToastComponent } = useAdminToast();

    const filteredOrders = initialOrders.filter(order =>
        order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginatedOrders = filteredOrders.slice(startIndex, startIndex + PAGE_SIZE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        const userStr = localStorage.getItem("admin_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.role === "Super Admin" || user.role === "super_admin") {
                    setCanExport(true);
                } else {
                    getRolePermissionsMap().then(map => {
                        const permissions = map[user.role] || [];
                        setCanExport(permissions.includes(PERMISSIONS.EXPORT_REPORTS));
                    });
                }
            } catch (e) {
                console.error("Error parsing user for export permission", e);
            }
        }
    }, []);

    const escapeCsv = (value: string | number): string => {
        const s = String(value);
        if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
        return s;
    };

    const handleExportReport = () => {
        const headers = ["Order ID", "Customer", "Email", "Date", "Total", "Status", "Payment Method", "Payment Status"];
        const rows = filteredOrders.map((order) => [
            order.orderNo,
            order.customer,
            order.email,
            format(new Date(order.date), "yyyy-MM-dd HH:mm"),
            order.total,
            order.status,
            order.paymentMethod ?? order.payment ?? "—",
            order.paymentStatus ?? "Pending",
        ]);
        const csvContent = [
            headers.map(escapeCsv).join(","),
            ...rows.map((row) => row.map(escapeCsv).join(",")),
        ].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orders-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Delivered": return "status-success";
            case "Processing": return "status-warning";
            case "Shipped": return "status-info";
            case "Pending": return "status-pending";
            case "Cancelled": return "status-danger";
            default: return "";
        }
    };

    const isOrderCompleted = (order: Order) => {
        return order.status === "Delivered" && (order.paymentStatus ?? "Pending") === "Paid";
    };

    const handleOpenStatusModal = (order: Order) => {
        setSelectedOrder(order);
        setNewStatus(order.status);
    };

    const performStatusUpdate = async () => {
        if (!selectedOrder) return;
        setLoading(true);
        const result = await updateOrderStatus(selectedOrder.id, newStatus);
        setLoading(false);
        setSelectedOrder(null);
        setShowOtpModal(false);
        setOtpValues(Array(6).fill(""));

        if (result.success) {
            showToast("Order status updated successfully");
        } else {
            showToast(result.error || "Failed to update order status", "error");
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedOrder || !newStatus || newStatus === selectedOrder.status) {
            setSelectedOrder(null);
            return;
        }

        if (newStatus === "Delivered") {
            setLoading(true);
            const contact = selectedOrder.phone || selectedOrder.email;
            const res = await sendOrderDeliveryOtp(selectedOrder.id, contact); 
            setLoading(false);
            if (res.success) {
                setShowOtpModal(true);
                return; // halt and wait for otp
            } else {
                showToast(res.error || "Failed to send OTP", "error");
                return;
            }
        }

        await performStatusUpdate();
    };

    const handleVerifyOtp = async () => {
        const finalOtp = otpValues.join("");
        if (!selectedOrder || finalOtp.length < 6) {
            showToast("OTP is required", "error");
            return;
        }
        setLoading(true);
        const res = await verifyOrderDeliveryOtp(selectedOrder.id, finalOtp);
        if (!res.success) {
            setLoading(false);
            showToast(res.error || "Invalid OTP", "error");
            return;
        }
        // OTP verified, perform status update
        await performStatusUpdate();
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        
        const newOtp = [...otpValues];
        newOtp[index] = value.substring(value.length - 1);
        setOtpValues(newOtp);

        if (value && index < 5) {
            const nextInput = document.getElementById(`list-otp-${index + 1}`);
            if (nextInput) (nextInput as HTMLInputElement).focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otpValues[index] && index > 0) {
            const prevInput = document.getElementById(`list-otp-${index - 1}`);
            if (prevInput) (prevInput as HTMLInputElement).focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text/plain").slice(0, 6).replace(/\D/g, "");
        if (pastedData) {
            const newOtp = [...otpValues];
            for (let i = 0; i < pastedData.length; i++) {
                if (i < 6) newOtp[i] = pastedData[i];
            }
            setOtpValues(newOtp);
            const focusIndex = Math.min(pastedData.length, 5);
            const nextInput = document.getElementById(`list-otp-${focusIndex}`);
            if (nextInput) (nextInput as HTMLInputElement).focus();
        }
    };

    const handleOpenPaymentModal = (order: Order) => {
        setPaymentOrder(order);
        setNewPaymentMethod((order.paymentMethod === "COD" || order.paymentMethod === "UPI" ? order.paymentMethod : "UPI") as "COD" | "UPI");
        setNewPaymentStatus((order.paymentStatus === "Paid" ? "Paid" : "Pending") as "Pending" | "Paid");
    };

    const handleUpdatePayment = async () => {
        if (!paymentOrder) {
            setPaymentOrder(null);
            return;
        }
        const sameMethod = (paymentOrder.paymentMethod === "COD" || paymentOrder.paymentMethod === "UPI" ? paymentOrder.paymentMethod : "UPI") === newPaymentMethod;
        const sameStatus = (paymentOrder.paymentStatus === "Paid" ? "Paid" : "Pending") === newPaymentStatus;
        if (sameMethod && sameStatus) {
            setPaymentOrder(null);
            return;
        }
        setLoading(true);
        const result = await updatePayment(paymentOrder.id, newPaymentMethod, newPaymentStatus);
        setLoading(false);
        setPaymentOrder(null);

        if (result.success) {
            showToast("Payment updated successfully");
        } else {
            showToast(result.error || "Failed to update payment", "error");
        }
    };

    return (
        <div className="orders-container">
            {ToastComponent}

            {selectedOrder && (
                <div className="modal-overlay">
                    <div className="status-modal">
                        <h3>Update Order Status</h3>
                        <p>Order: <strong>{selectedOrder.orderNo}</strong></p>
                        <div className="input-group">
                            <label>Status</label>
                            <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setSelectedOrder(null)}>Cancel</button>
                            <button className="save-btn" onClick={handleUpdateStatus} disabled={loading}>
                                {loading ? "Updating..." : "Update Status"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showOtpModal && selectedOrder && (
                <div className="modal-overlay">
                    <div className="status-modal">
                        <h3>Verify Delivery OTP</h3>
                        <p>An OTP has been sent to the customer&apos;s mobile number ({selectedOrder.phone || selectedOrder.email}). Please ask the customer and enter it below to confirm delivery.</p>
                        <div className="otp-container">
                            <label className="otp-label">Verification Code</label>
                            <div className="otp-inputs-wrapper">
                                {otpValues.map((v, i) => (
                                    <input
                                        key={i}
                                        id={`list-otp-${i}`}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={v}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                        onPaste={handleOtpPaste}
                                        className="otp-box-input"
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => { setShowOtpModal(false); setOtpValues(Array(6).fill("")); }}>Cancel</button>
                            <button className="save-btn" onClick={handleVerifyOtp} disabled={loading || otpValues.join("").length < 6}>
                                {loading ? "Verifying..." : "Verify & Mark Delivered"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {qrOrder && (qrOrder.paymentMethod === "UPI" || qrOrder.payment === "UPI") && (
                <div className="modal-overlay" onClick={() => setQrOrder(null)}>
                    <div className="status-modal upi-qr-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>UPI QR Code</h3>
                        <p className="text-muted small mb-3">Order: <strong>{qrOrder.orderNo}</strong> — {qrOrder.total}</p>
                        <UPIQrCode amount={parseOrderTotal(qrOrder.total)} orderNo={qrOrder.orderNo} size={200} showHeading />
                        <div className="modal-actions mt-3">
                            <button type="button" className="cancel-btn" onClick={() => setQrOrder(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {paymentOrder && (
                <div className="modal-overlay">
                    <div className="status-modal">
                        <h3>Update Payment</h3>
                        <p>Order: <strong>{paymentOrder.orderNo}</strong></p>
                        <div className="input-group">
                            <label>Payment Method</label>
                            <select
                                value={newPaymentMethod}
                                onChange={(e) => setNewPaymentMethod(e.target.value as "COD" | "UPI")}
                            >
                                <option value="COD">COD</option>
                                <option value="UPI">UPI</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Payment Status</label>
                            <select
                                value={newPaymentStatus}
                                onChange={(e) => setNewPaymentStatus(e.target.value as "Pending" | "Paid")}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid</option>
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setPaymentOrder(null)}>Cancel</button>
                            <button className="save-btn payment-save-btn" onClick={handleUpdatePayment} disabled={loading}>
                                {loading ? "Updating..." : "Update Payment"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="orders-header">
                <div className="header-info">
                    <h3>Orders List</h3>
                    <p>Manage and track all customer orders from one place.</p>
                </div>
                <div className="header-actions">
                    {canExport && (
                        <button type="button" className="export-btn" onClick={handleExportReport}>
                            <i className="bi bi-download"></i>
                            Export Report
                        </button>
                    )}
                </div>
            </div>

            <div className="table-card">
                <div className="table-actions">
                    <div className="search-box">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Search by Order ID or Customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th className="hide-mobile">Order ID</th>
                                <th>Customer</th>
                                <th className="hide-mobile">Date</th>
                                <th className="hide-mobile">Total</th>
                                <th className="hide-mobile">Status</th>
                                <th className="hide-mobile">Payment Method</th>
                                <th className="hide-mobile">Payment Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedOrders.map((order) => (
                                <tr key={order.id} className="order-row">
                                    <td className="order-id hide-mobile">{order.orderNo}</td>
                                    <td>
                                        <div className="order-mobile-brief mobile-only">
                                            <div className="brief-main">
                                                <span className="mobile-order-no">{order.orderNo}</span>
                                                <span className="mobile-total">{order.total}</span>
                                            </div>
                                            <div className="brief-customer">
                                                <i className="bi bi-person"></i> {order.customer}
                                            </div>
                                            <div className="brief-sub">
                                                <span className="mobile-date">
                                                    <i className="bi bi-calendar3"></i> {format(new Date(order.date), 'MMM dd, yyyy')}
                                                </span>
                                                <span className={`status-badge ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                                <span className={`payment-status-badge ${(order.paymentStatus ?? "Pending") === "Paid" ? "paid" : "pending"}`}>
                                                    {order.paymentStatus ?? "Pending"}
                                                </span>
                                            </div>
                                            <div className="mobile-action-bar">
                                                <button className="mobile-action-btn view" onClick={() => router.push(`/admin/orders/${order.id}`)}>
                                                    <i className="bi bi-eye"></i> View Order
                                                </button>
                                                <div className="action-icons">
                                                    <button className="icon-btn edit" title="Update Status" onClick={() => handleOpenStatusModal(order)} disabled={isOrderCompleted(order)}>
                                                        <i className="bi bi-pencil-square"></i>
                                                    </button>
                                                    <button className="icon-btn payment" title="Update Payment" onClick={() => handleOpenPaymentModal(order)} disabled={isOrderCompleted(order)}>
                                                        <i className="bi bi-credit-card"></i>
                                                    </button>
                                                    {(order.paymentMethod === "UPI" || order.payment === "UPI") && (
                                                        <button className="icon-btn qr-view" title="QR Code" onClick={() => setQrOrder(order)} disabled={isOrderCompleted(order)}>
                                                            <i className="bi bi-qr-code"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="customer-info hide-mobile">
                                            <span className="name">{order.customer}</span>
                                            <span className="email">{order.email}</span>
                                        </div>
                                    </td>
                                    <td className="hide-mobile">{format(new Date(order.date), 'MMM dd, yyyy')}</td>
                                    <td className="total-amount hide-mobile">{order.total}</td>
                                    <td className="hide-mobile">
                                        <span className={`status-badge ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="hide-mobile">
                                        <div className="payment-method-cell">
                                            <span className="payment-method-badge">
                                                {order.paymentMethod ?? order.payment ?? "—"}
                                            </span>
                                            {(order.paymentMethod === "UPI" || order.payment === "UPI") && (
                                                <button
                                                    type="button"
                                                    className="icon-btn qr-view"
                                                    title="View UPI QR Code"
                                                    onClick={() => setQrOrder(order)}
                                                    disabled={isOrderCompleted(order)}
                                                >
                                                    <i className="bi bi-qr-code"></i>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="hide-mobile">
                                        <span className={`payment-status-badge ${(order.paymentStatus ?? "Pending") === "Paid" ? "paid" : "pending"}`}>
                                            {order.paymentStatus ?? "Pending"}
                                        </span>
                                    </td>
                                    <td className="hide-mobile">
                                        <div className="action-btns">
                                            <button className="icon-btn view" title="View Order" onClick={() => router.push(`/admin/orders/${order.id}`)}>
                                                <i className="bi bi-eye"></i>
                                            </button>
                                            <button className="icon-btn edit" title="Update Order Status" onClick={() => handleOpenStatusModal(order)} disabled={isOrderCompleted(order)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="icon-btn payment" title="Update Payment Status" onClick={() => handleOpenPaymentModal(order)} disabled={isOrderCompleted(order)}>
                                                <i className="bi bi-credit-card"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            type="button"
                            className="pager-btn"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            aria-label="Previous page"
                        >
                            <i className="bi bi-chevron-left"></i>
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i + 1}
                                type="button"
                                className={`pager-btn ${currentPage === i + 1 ? "active" : ""}`}
                                onClick={() => setCurrentPage(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="pager-btn"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            aria-label="Next page"
                        >
                            <i className="bi bi-chevron-right"></i>
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
        .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(4px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .status-modal {
            background: #fff;
            padding: 2rem;
            border-radius: 20px;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        }

        .status-modal h3 { font-size: 1.25rem; margin-bottom: 0.5rem; color: #0f172a; }
        .status-modal p { color: #64748b; margin-bottom: 1.5rem; }

        .input-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
        .input-group label { font-size: 0.8125rem; font-weight: 600; color: #64748b; }
        .input-group select { padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-family: inherit; font-size: 0.9375rem; width: 100%; box-sizing: border-box; }
        .input-group select:focus { outline: none; border-color: #ffc451; box-shadow: 0 0 0 4px rgba(255, 196, 81, 0.1); background: #fff; }

        .otp-container { display: flex; flex-direction: column; align-items: center; margin-bottom: 2rem; width: 100%; }
        .otp-label { display: block; font-size: 0.875rem; font-weight: 700; color: #64748b; margin-bottom: 1rem; text-align: center; }
        .otp-inputs-wrapper { display: flex; gap: 0.5rem; justify-content: center; width: 100%; }
        .otp-box-input { width: 44px; height: 52px; text-align: center; font-size: 1.25rem; font-weight: 700; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; color: #1e293b; transition: 0.2s; box-sizing: border-box; }
        .otp-box-input:focus { outline: none; border-color: #ffc451; box-shadow: 0 0 0 4px rgba(255, 196, 81, 0.1); background: #fff; }

        .modal-actions { display: flex; gap: 1rem; }
        .modal-actions button { flex: 1; padding: 0.875rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .cancel-btn { background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; }
        .cancel-btn:hover { background: #f1f5f9; }
        .save-btn { background: #ffc451; border: none; color: #fff; }
        .save-btn:hover { background: #f8b42d; transform: translateY(-2px); }

        .orders-container { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .orders-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .header-info h3 { font-size: 1.5rem; margin: 0; color: #0f172a; font-weight: 700; }
        .header-info p { color: #64748b; margin: 0; }
        .export-btn { display: flex; align-items: center; gap: 0.5rem; padding: 10px 20px; background: #fff; color: #0f172a; border-radius: 12px; font-weight: 600; cursor: pointer; border: 1px solid #e2e8f0; }
        .table-card { background: #fff; border-radius: 20px; border: 1px solid #f1f5f9; overflow: hidden; }
        .table-actions { padding: 1.5rem; display: flex; gap: 1rem; border-bottom: 1px solid #f1f5f9; }
        .search-box { position: relative; flex: 1; }
        .search-box i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .search-box input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; }
        .orders-table { width: 100%; border-collapse: collapse; text-align: left; }
        .orders-table th { padding: 1.25rem 1.5rem; background: #f8fafc; color: #64748b; font-size: 0.875rem; text-transform: uppercase; }
        .orders-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; }
        .order-id { font-weight: 700; color: #0f172a; }
        .customer-info .name { font-weight: 600; color: #0f172a; display: block; }
        .customer-info .email { font-size: 0.8125rem; color: #94a3b8; }
        .status-badge { padding: 6px 12px; border-radius: 100px; font-size: 0.75rem; font-weight: 700; display: inline-block; min-width: 80px; text-align: center; }
        .status-success { background: #dcfce7; color: #166534; }
        .status-warning { background: #fef9c3; color: #854d0e; }
        .status-info { background: #e0f2fe; color: #075985; }
        .status-pending { background: #f1f5f9; color: #475569; }
        .status-danger { background: #fee2e2; color: #991b1b; }
        .payment-method-cell { display: inline-flex; align-items: center; gap: 0.4rem; }
        .payment-method-badge { font-size: 0.8125rem; font-weight: 600; padding: 4px 10px; border-radius: 6px; background: #f1f5f9; color: #475569; }
        .payment-status-badge { font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 6px; display: inline-block; min-width: 72px; text-align: center; }
        .payment-status-badge.paid { background: #dcfce7; color: #166534; }
        .payment-status-badge.pending { background: #fef9c3; color: #854d0e; }
        .paid { color: #16a34a; }
        .unpaid { color: #dc2626; }
        .icon-btn { width: 36px; height: 36px; border-radius: 10px; border: 1px solid #f1f5f9; background: #fff; color: #64748b; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .icon-btn.view { background: #faf5ff; color: #7c3aed; border-color: #faf5ff; }
        .icon-btn.edit { background: #f0f9ff; color: #0369a1; border-color: #f0f9ff; }
        .icon-btn.payment { background: #f0fdf4; color: #166534; border-color: #f0fdf4; }
        .icon-btn.qr-view { background: #eff6ff; color: #1d4ed8; border-color: #eff6ff; }
        .icon-btn:hover:not(:disabled) { background: #ffc451; color: #fff; border-color: #ffc451; transform: translateY(-2px); }
        .icon-btn:disabled { opacity: 0.4; cursor: not-allowed; filter: grayscale(1); }
        .upi-qr-modal { text-align: center; }
        .upi-qr-modal :global(.upi-qr-wrap) { justify-content: center; display: flex; flex-direction: column; align-items: center; margin: 0 auto; }
        .action-btns { display: flex; gap: 0.5rem; }
        .payment-save-btn { background: #16a34a !important; }
        .payment-save-btn:hover { background: #15803d !important; }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          padding: 1.5rem;
          background: #fafbfc;
          border-top: 1px solid #f1f5f9;
          flex-wrap: wrap;
        }
        .pager-btn {
          min-width: 40px;
          height: 40px;
          padding: 0 0.5rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #64748b;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
          flex-shrink: 0;
        }
        .pager-btn:hover:not(:disabled) {
          border-color: #ffc451;
          color: #ffc451;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 196, 81, 0.2);
        }
        .pager-btn.active {
          background: #ffc451;
          border-color: #ffc451;
          color: #fff;
          box-shadow: 0 4px 10px rgba(255, 196, 81, 0.25);
        }
        .pager-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f8fafc;
        }

        @media (max-width: 768px) {
            .orders-header {
                flex-direction: column;
                align-items: stretch;
                gap: 1.5rem;
                margin-bottom: 1.5rem;
            }
            .header-info h3 { font-size: 1.25rem; }
            .header-actions { width: 100%; }
            .export-btn { width: 100%; justify-content: center; padding: 12px; font-size: 0.9rem; }
            
            .table-card { background: transparent; border: none; }
            .table-actions { padding: 0 0 1rem 0; background: transparent; border: none; }
            .search-box input { background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

            .orders-table, .orders-table tbody, .orders-table tr, .orders-table td { display: block; width: 100%; }
            .orders-table thead, .hide-mobile { display: none !important; }
            
            .orders-table tr {
                background: #fff;
                margin-bottom: 0.75rem;
                border-radius: 16px;
                padding: 1rem;
                box-shadow: 0 2px 4px rgba(0,0,0,0.04);
                border: 1px solid #f1f5f9;
                display: flex;
                flex-direction: column;
                gap: 0;
            }
            
            .orders-table td { padding: 0 !important; border: none !important; width: 100%; }
            
            .order-mobile-brief {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            .brief-main {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .mobile-order-no {
                font-weight: 800;
                color: #0d9488;
                font-size: 0.75rem;
                background: #f0fdfa;
                padding: 2px 8px;
                border-radius: 8px;
            }
            .mobile-total {
                font-weight: 700;
                color: #0f172a;
                font-size: 0.95rem;
            }
            .brief-customer {
                font-weight: 600;
                color: #475569;
                font-size: 0.85rem;
                display: flex;
                align-items: center;
                gap: 0.4rem;
            }
            .brief-customer i { color: #94a3b8; font-size: 0.8rem; }
            .brief-sub {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex-wrap: wrap;
                padding: 0.4rem 0;
                border-top: 1px dashed #f1f5f9;
            }
            .mobile-date {
                font-size: 0.7rem;
                color: #64748b;
                display: inline-flex;
                align-items: center;
                gap: 0.3rem;
                margin-right: auto;
            }
            .brief-sub :global(.status-badge) {
                min-width: auto;
                padding: 2px 8px;
                font-size: 0.65rem;
            }
            .brief-sub :global(.payment-status-badge) {
                min-width: auto;
                padding: 2px 8px;
                font-size: 0.65rem;
            }

            .mobile-action-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 0.75rem;
                margin-top: 0.25rem;
                padding-top: 0.75rem;
                border-top: 1px solid #f1f5f9;
            }
            .mobile-action-btn.view {
                flex: 1;
                background: #ffc451;
                color: #fff;
                border: none;
                padding: 8px;
                border-radius: 10px;
                font-weight: 700;
                font-size: 0.8rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.4rem;
            }
            .action-icons { display: flex; gap: 0.4rem; }
            .action-icons .icon-btn {
                width: 32px;
                height: 32px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                color: #64748b;
                border-radius: 8px;
                font-size: 0.85rem;
            }
            
            .pagination {
                flex-direction: column;
                text-align: center;
                gap: 1.25rem;
                background: #fff;
                margin-top: 1.5rem;
                border-radius: 16px;
                padding: 1.5rem;
            }
        }
        
        .mobile-only { display: none; }
        @media (max-width: 768px) {
            .mobile-only { display: flex; }
        }
      `}</style>
        </div>
    );
}
