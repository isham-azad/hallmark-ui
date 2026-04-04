"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { updateOrderStatus, updatePayment, sendOrderDeliveryOtp, verifyOrderDeliveryOtp, assignOrderStaff } from "../actions";
import { useAdminToast } from "@/components/AdminToast";
import UPIQrCode from "@/components/UPIQrCode";
import { parseOrderTotal } from "@/lib/upi";
import { AdminUser } from "../../staff/actions";

interface OrderItemType {
    id: string;
    name: string;
    sku: string | null;
    qty: number;
    price: string;
    image?: string | null;
}

interface OrderType {
    id: string;
    orderNo: string;
    customer: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    zip?: string | null;
    shippingName?: string | null;
    shippingAddress?: string | null;
    date: Date | string;
    total: string;
    status: string;
    payment: string;
    paymentMethod?: string;
    paymentStatus?: string;
    items: OrderItemType[];
    assignedTo?: { id: string; name: string; assignedAt: any; } | null;
    rewardsUsed?: number;
    rewardsEarned?: number;
    voucherAmount?: number;
}

interface OrderDetailClientProps {
    order: OrderType;
    availableStaff: AdminUser[];
}

export default function OrderDetailClient({ order, availableStaff }: OrderDetailClientProps) {
    const router = useRouter();
    const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
    const [newStatus, setNewStatus] = useState("");
    const [paymentOrder, setPaymentOrder] = useState<OrderType | null>(null);
    const [newPaymentMethod, setNewPaymentMethod] = useState<"COD" | "UPI">("UPI");
    const [newPaymentStatus, setNewPaymentStatus] = useState<"Pending" | "Paid">("Pending");
    const [showQrModal, setShowQrModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState("");
    const { showToast, ToastComponent } = useAdminToast();

    useEffect(() => {
        const userStr = localStorage.getItem("admin_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const role = String(user.role || "").toLowerCase();
                const isSA = role.includes("super") || role.includes("admin") || role === "1";
                if (isSA) setIsSuperAdmin(true);
            } catch (e) {}
        }
    }, []);

    const handleAssignStaff = async () => {
        if (!selectedStaffId) return;
        setLoading(true);
        try {
            const staff = availableStaff.find(s => s.id === selectedStaffId);
            const res = await assignOrderStaff(order.id, selectedStaffId, staff?.name || "Staff");
            if (res.success) {
                showToast("Order assigned successfully");
                setAssignModalOpen(false);
                router.refresh();
            } else {
                showToast(res.error || "Failed to assign order", "error");
            }
        } catch (err) {
            showToast("Something went wrong", "error");
        } finally {
            setLoading(false);
        }
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

    const handleOpenStatusModal = () => {
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
            router.refresh();
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
                return;
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
        await performStatusUpdate();
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otpValues];
        newOtp[index] = value.substring(value.length - 1);
        setOtpValues(newOtp);

        if (value && index < 5) {
            const nextInput = document.getElementById(`detail-otp-${index + 1}`);
            if (nextInput) (nextInput as HTMLInputElement).focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otpValues[index] && index > 0) {
            const prevInput = document.getElementById(`detail-otp-${index - 1}`);
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
            const nextInput = document.getElementById(`detail-otp-${focusIndex}`);
            if (nextInput) (nextInput as HTMLInputElement).focus();
        }
    };

    const handleOpenPaymentModal = () => {
        setPaymentOrder(order);
        setNewPaymentMethod((order.paymentMethod === "COD" || order.paymentMethod === "UPI" ? order.paymentMethod : "UPI") as "COD" | "UPI");
        setNewPaymentStatus((order.paymentStatus === "Paid" ? "Paid" : "Pending") as "Pending" | "Paid");
    };

    const handleUpdatePaymentClick = async () => {
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
            router.refresh();
        } else {
            showToast(result.error || "Failed to update payment", "error");
        }
    };

    const isOrderCompleted = order.status === "Delivered" && (order.paymentStatus ?? "Pending") === "Paid";
    const orderDate = order.date instanceof Date ? order.date : new Date(order.date);

    return (
        <div className="order-detail-container">
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
                                        id={`detail-otp-${i}`}
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

            {showQrModal && (order.paymentMethod === "UPI" || order.payment === "UPI") && (
                <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
                    <div className="status-modal upi-qr-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>UPI QR Code</h3>
                        <p className="text-muted small mb-3">Order: <strong>{order.orderNo}</strong> — {order.total}</p>
                        <UPIQrCode amount={parseOrderTotal(order.total)} orderNo={order.orderNo} size={200} showHeading />
                        <div className="modal-actions mt-3">
                            <button type="button" className="cancel-btn" onClick={() => setShowQrModal(false)}>Close</button>
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
                            <button className="save-btn payment-save-btn" onClick={handleUpdatePaymentClick} disabled={loading}>
                                {loading ? "Updating..." : "Update Payment"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {assignModalOpen && (
                <div className="modal-overlay">
                    <div className="status-modal assign-modal">
                        <h3>Assign Order to Staff</h3>
                        <p className="text-muted small">Select a staff member to handle delivery for order <strong>{order.orderNo}</strong></p>

                        <div className="input-group mt-3">
                            <label>Staff Member</label>
                            <select
                                value={selectedStaffId}
                                onChange={(e) => setSelectedStaffId(e.target.value)}
                                className="staff-select"
                            >
                                <option value="">Select Staff</option>
                                {availableStaff.map((staff) => (
                                    <option key={staff.id} value={staff.id}>{staff.name} ({staff.email})</option>
                                ))}
                            </select>
                        </div>

                        <div className="modal-actions mt-4">
                            <button className="cancel-btn" onClick={() => { setAssignModalOpen(false); setSelectedStaffId(""); }}>Cancel</button>
                            <button
                                className="save-btn"
                                onClick={handleAssignStaff}
                                disabled={loading || !selectedStaffId}
                            >
                                {loading ? "Assigning..." : "Assign Order"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="detail-header">
                <Link href="/admin/orders" className="back-link">
                    <i className="bi bi-arrow-left"></i>
                    Back to Orders
                </Link>
                <div className="detail-header-row">
                    <div className="detail-header-title">
                        <h1>Order Details</h1>
                        <p className="order-no">{order.orderNo}</p>
                    </div>
                    <div className="detail-header-actions">
                        {(order.paymentMethod === "UPI" || order.payment === "UPI") && (
                            <button type="button" className="header-btn qr-btn" title="View UPI QR Code" onClick={() => setShowQrModal(true)} disabled={isOrderCompleted}>
                                <i className="bi bi-qr-code"></i>
                            </button>
                        )}
                        <button type="button" className="header-btn invoice" title="Get Invoice" onClick={() => router.push(`/admin/orders/${order.id}/invoice`)}>
                            <i className="bi bi-receipt"></i>
                        </button>
                        <button type="button" className="header-btn secondary" title="Update Order Status" onClick={handleOpenStatusModal} disabled={isOrderCompleted}>
                            <i className="bi bi-pencil-square"></i>
                        </button>
                        {isSuperAdmin && (
                            <button
                                type="button"
                                className="header-btn assign-btn"
                                title={order.status === "Delivered" ? "Order Delivered - Cannot Reassign" : (order.assignedTo ? `Assigned to: ${order.assignedTo.name}` : "Assign to Staff")}
                                onClick={() => {
                                    setAssignModalOpen(true);
                                    setSelectedStaffId(order.assignedTo?.id || "");
                                }}
                                disabled={order.status === "Delivered"}
                            >
                                <i className={`bi ${order.assignedTo ? 'bi-person-check-fill' : 'bi-person-plus'}`}></i>
                            </button>
                        )}
                        <button type="button" className="header-btn primary" title="Update Payment Status" onClick={handleOpenPaymentModal} disabled={isOrderCompleted}>
                            <i className="bi bi-credit-card"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div className="detail-card">
                <div className="detail-grid">
                    <div className="detail-item">
                        <span className="detail-label">Customer</span>
                        <span className="detail-value">{order.customer}</span>
                    </div>
                    {order.phone && (
                        <div className="detail-item">
                            <span className="detail-label">Phone</span>
                            <span className="detail-value">{order.phone}</span>
                        </div>
                    )}
                    <div className="detail-item email-row">
                        <span className="detail-label">Email</span>
                        <span className="detail-value">{order.email}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Order Date</span>
                        <span className="detail-value">{format(new Date(order.date), "MMM dd, yyyy – hh:mm a")}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Order Status</span>
                        <span className={`detail-value status-text ${getStatusColor(order.status)}`}>{order.status}</span>
                    </div>
                    <div className="detail-item full-row total-amount-item">
                        <span className="detail-label">Total Amount</span>
                        <span className="detail-value detail-total">{order.total}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Payment Method</span>
                        <span className="detail-value">{order.paymentMethod ?? order.payment ?? "—"}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Payment Status</span>
                        <span className={`detail-value payment-status-text ${(order.paymentStatus ?? "Pending") === "Paid" ? "paid" : "pending"}`}>
                            {order.paymentStatus ?? "Pending"}
                        </span>
                    </div>
                    {order.assignedTo && (
                        <div className="detail-item full-row assign-info-row">
                            <span className="detail-label">Assigned Staff</span>
                            <span className="detail-value assigned-staff-badge">
                                <i className="bi bi-person-badge"></i>
                                {order.assignedTo.name}
                                <span className="assigned-time">
                                    at {format(new Date(order.assignedTo.assignedAt), "MMM dd, yyyy – hh:mm a")}
                                </span>
                            </span>
                        </div>
                    )}
                    {(order.address || order.city || order.zip) && (
                        <div className="detail-item address-row">
                            <span className="detail-label">Billing Address</span>
                            <span className="detail-value detail-address">
                                {[order.address, order.city, order.zip].filter(Boolean).join(", ") || "—"}
                            </span>
                        </div>
                    )}
                    {order.shippingAddress && (order.shippingAddress !== order.address || order.shippingName) && (
                        <div className="detail-item address-row">
                            <span className="detail-label">Shipping Address</span>
                            <span className="detail-value detail-address">
                                {order.shippingName && <div className="fw-bold mb-1">{order.shippingName}</div>}
                                {order.shippingAddress}
                            </span>
                        </div>
                    )}
                </div>

                {order.items.length > 0 && (
                    <div className="items-section">
                        <h4 className="items-title">Order Items</h4>
                        <table className="items-table">
                            <thead>
                                <tr>
                                    <th className="th-product">Product</th>
                                    <th className="th-qty">Qty</th>
                                    <th className="th-price">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item, index) => (
                                    <tr key={`${item.id}-${index}`}>
                                        <td className="item-name">
                                            <div className="product-info-cell">
                                                <div className="product-thumb">
                                                    <img
                                                        src={item.image || "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566376/hallmark/assets/img/masonry-portfolio/masonry-portfolio-1.jpg"}
                                                        alt={item.name}
                                                    />
                                                </div>
                                                <div className="product-name-block">
                                                    <span className="product-main-name">{item.name}</span>
                                                    {(item.sku && item.sku !== "Standard") && (
                                                        <span className="product-sku-sub">SKU: {item.sku}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="item-qty">{item.qty}</td>
                                        <td className="item-price">{item.price}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                {order.rewardsUsed ? (
                                    <tr className="items-total-row rewards-row">
                                        <td colSpan={2} className="items-total-label text-danger">Rewards Applied</td>
                                        <td className="items-total-value text-danger">-₹{order.rewardsUsed.toFixed(2)}</td>
                                    </tr>
                                ) : null}
                                {order.voucherAmount ? (
                                    <tr className="items-total-row rewards-row">
                                        <td colSpan={2} className="items-total-label text-primary">Voucher Applied</td>
                                        <td className="items-total-value text-primary">-₹{order.voucherAmount.toFixed(2)}</td>
                                    </tr>
                                ) : null}
                                <tr className="items-total-row">
                                    <td colSpan={2} className="items-total-label">Final Order Total</td>
                                    <td className="items-total-value">{order.total}</td>
                                </tr>
                            </tfoot>
                        </table>

                        {(order.rewardsEarned || 0) > 0 && (
                            <div className="rewards-earned-celebration">
                                <div className="celebration-content">
                                    <div className="celebration-icon">
                                        <i className="bi bi-gift-fill"></i>
                                    </div>
                                    <div className="celebration-text">
                                        <h4>Congratulations!</h4>
                                        <p>You've earned <span>₹{(order.rewardsEarned || 0).toFixed(2)}</span> reward points on this order.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Card View (Mobile Only) */}
                        <div className="items-cards">
                            {order.items.map((item, index) => {
                                const priceNum = parseFloat((item.price || "0").toString().replace(/[^0-9.]/g, ""));
                                const subtotal = priceNum * item.qty;
                                const currency = (item.price || "").toString().includes("₹") ? "₹" : "";
                                
                                return (
                                    <div key={`${item.id}-${index}`} className="item-card">
                                        <div className="item-card-header">
                                            <div className="item-card-img">
                                                <img
                                                    src={item.image || "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566376/hallmark/assets/img/masonry-portfolio/masonry-portfolio-1.jpg"}
                                                    alt={item.name}
                                                />
                                            </div>
                                            <div className="item-info">
                                                <div className="item-name-row">
                                                    <span className="item-card-name">{item.name}</span>
                                                    <span className="item-qty-badge">x{item.qty}</span>
                                                </div>
                                                {(item.sku && item.sku !== "Standard") && (
                                                    <span className="item-card-sku">SKU: {item.sku}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="item-price-details">
                                            <div className="price-row">
                                                <span className="price-label">Price Each</span>
                                                <span className="price-val">{item.price}</span>
                                            </div>
                                            <div className="price-row total-row">
                                                <span className="price-label">Subtotal</span>
                                                <span className="price-val subtotal-val">{currency}{subtotal}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {order.rewardsUsed ? (
                                <div className="item-card rewards-card text-danger" style={{ borderStyle: 'dashed', borderColor: '#fee2e2', backgroundColor: '#fef2f2' }}>
                                    <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="price-label">Rewards Applied</span>
                                        <span className="price-val fw-bold">-₹{order.rewardsUsed.toFixed(2)}</span>
                                    </div>
                                </div>
                            ) : null}
                            {order.voucherAmount ? (
                                <div className="item-card rewards-card text-primary" style={{ borderStyle: 'dashed', borderColor: '#dbeafe', backgroundColor: '#eff6ff' }}>
                                    <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="price-label">Voucher Applied</span>
                                        <span className="price-val fw-bold">-₹{order.voucherAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            ) : null}
                            <div className="items-mobile-total">
                                <span className="mobile-total-label">Final order Total</span>
                                <span className="mobile-total-value">{order.total}</span>
                            </div>
                            {(order.rewardsEarned || 0) > 0 && (
                                <div className="mobile-rewards-celebration">
                                    <i className="bi bi-gift-fill me-2"></i>
                                    <span>Reward Points Earned: <b>₹{(order.rewardsEarned || 0).toFixed(2)}</b></span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {order.items.length === 0 && (
                    <div className="no-items">
                        <i className="bi bi-box"></i>
                        <span>No items linked to this order yet.</span>
                    </div>
                )}
            </div>

            <style jsx>{`
                .order-detail-container { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                /* 🏠 Fixed Modal Overlay System */
                .modal-overlay { 
                    position: fixed; 
                    top: 0; left: 0; 
                    width: 100vw; height: 100vh; 
                    background: rgba(15, 23, 42, 0.4); 
                    backdrop-filter: blur(8px); 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    z-index: 9999; 
                    animation: fadeIn 0.3s ease;
                    padding: 1.5rem;
                }
                .status-modal { 
                    background: #fff; 
                    padding: 2.5rem; 
                    border-radius: 24px; 
                    width: 100%; 
                    max-width: 480px; 
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); 
                    animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes modalSlideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

                .status-modal h3 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-bottom: 1.5rem; }
                .status-modal p { color: #64748b; margin-bottom: 1.5rem; }
                .input-group { margin-bottom: 1.5rem; }
                .input-group label { display: block; font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.5rem; }
                .input-group select { width: 100%; height: 48px; border-radius: 12px; border: 1px solid #e2e8f0; padding: 0 1rem; font-weight: 600; color: #1e293b; transition: 0.2s; box-sizing: border-box; }
                .input-group select:focus { outline: none; border-color: #ffc451; box-shadow: 0 0 0 4px rgba(255, 196, 81, 0.1); }
                
                .otp-container { display: flex; flex-direction: column; align-items: center; margin-bottom: 2rem; width: 100%; }
                .otp-label { display: block; font-size: 0.875rem; font-weight: 700; color: #64748b; margin-bottom: 1rem; text-align: center; }
                .otp-inputs-wrapper { display: flex; gap: 0.5rem; justify-content: center; width: 100%; }
                .otp-box-input { width: 44px; height: 52px; text-align: center; font-size: 1.25rem; font-weight: 700; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; color: #1e293b; transition: 0.2s; box-sizing: border-box; }
                .otp-box-input:focus { outline: none; border-color: #ffc451; box-shadow: 0 0 0 4px rgba(255, 196, 81, 0.1); background: #fff; }

                .modal-actions { display: flex; gap: 1rem; margin-top: 2rem; width: 100%; }
                .modal-actions button { flex: 1; height: 48px; border-radius: 12px; font-weight: 700; transition: 0.2s; cursor: pointer; }
                .cancel-btn { background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; }
                .save-btn { background: #ffc451; border: none; color: #fff; }
                .save-btn:hover { background: #f8b42d; }
                .upi-qr-modal { display: flex; flex-direction: column; align-items: center; text-align: center; }
                .upi-qr-modal :global(.qr-wrapper) { display: flex; justify-content: center; width: 100%; margin: 1.5rem 0; }
                
                .detail-header { margin-bottom: 2rem; }
                .back-link { display: inline-flex; align-items: center; gap: 0.5rem; color: #64748b; font-size: 0.9375rem; font-weight: 600; text-decoration: none; margin-bottom: 1rem; transition: color 0.2s; }
                .back-link:hover { color: #ffc451; }
                .detail-header-row { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
                .detail-header-title h1 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0 0 0.25rem; }
                .order-no { font-size: 0.875rem; color: #94a3b8; margin: 0; font-weight: 500; }
                .detail-header-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
                .header-btn { min-width: 40px; min-height: 40px; width: 40px; height: 40px; padding: 0; border-radius: 12px; font-size: 1.125rem; font-weight: 700; cursor: pointer; transition: 0.2s; border: 1px solid transparent; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; box-sizing: border-box; }
                .header-btn.secondary { background: #fff; border-color: #e2e8f0; color: #64748b; }
                .header-btn.secondary:hover:not(:disabled) { background: #f8fafc; color: #0f172a; transform: translateY(-2px); }
                .header-btn.primary { background: #ffc451; border: none; color: #fff; }
                .header-btn.primary:hover:not(:disabled) { background: #f8b42d; transform: translateY(-2px); }
                .header-btn:disabled { opacity: 0.4; cursor: not-allowed; filter: grayscale(1); }
                .header-btn.qr-btn { background: #eff6ff; border-color: #dbeafe; color: #1d4ed8; }
                .header-btn.qr-btn:hover:not(:disabled) { background: #dbeafe; color: #1d4ed8; transform: translateY(-2px); }
                .header-btn.invoice { background: #f5f3ff; border-color: #e9e5ff; color: #6d28d9; }
                .header-btn.invoice:hover { background: #ede9fe; color: #5b21b6; transform: translateY(-2px); }
                .header-btn.assign-btn { background: #fff7ed; border-color: #ffedd5; color: #c2410c; }
                .header-btn.assign-btn:hover:not(:disabled) { background: #ffedd5; transform: translateY(-2px); }

                .detail-card { background: #fff; border-radius: 20px; border: 1px solid #f1f5f9; padding: 2rem; }
                .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
                .detail-item { display: flex; flex-direction: column; gap: 0.375rem; }
                .detail-item-full { grid-column: 1 / -1; }
                .detail-address { white-space: pre-line; max-width: 100%; }
                .detail-label { font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
                .detail-value { font-size: 0.9375rem; font-weight: 500; color: #0f172a; }
                .detail-total { font-size: 1.125rem; font-weight: 700; color: #0f172a; }
                .status-text { font-weight: 600; }
                .status-text.status-success { color: #166534; }
                .status-text.status-warning { color: #854d0e; }
                .status-text.status-info { color: #075985; }
                .status-text.status-pending { color: #475569; }
                .status-text.status-danger { color: #991b1b; }
                .payment-status-text { font-weight: 600; }
                .payment-status-text.paid { color: #16a34a; }
                .payment-status-text.pending { color: #854d0e; }
                .items-section { margin-top: 2rem; border-top: 1px solid #f1f5f9; padding-top: 1.5rem; }
                .items-title { font-size: 0.8125rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 1rem; }
                .items-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
                .items-table th { padding: 0.75rem 1rem; background: #f8fafc; color: #94a3b8; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
                .items-table th.th-product, .items-table th.th-sku { text-align: left; }
                .items-table th.th-qty, .items-table th.th-price { text-align: right; }
                .items-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
                .items-table tr:last-child td { border-bottom: none; }
                .items-table tfoot { border-top: 2px solid #e2e8f0; }
                .items-total-row td { padding: 1rem 1rem; font-weight: 700; vertical-align: middle; }
                .items-total-label { color: #64748b; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }
                .items-total-value { color: #0f172a; font-size: 1.125rem; text-align: right; min-width: 6rem; }
                
                .rewards-earned-celebration { 
                    margin-top: 1.5rem; 
                    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); 
                    border: 1px solid #bbf7d0; 
                    border-radius: 16px; 
                    padding: 1.25rem 1.5rem; 
                    animation: slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .celebration-content { display: flex; align-items: center; gap: 1.25rem; }
                .celebration-icon { 
                    width: 48px; height: 48px; background: #fff; color: #166534; 
                    border-radius: 12px; display: flex; align-items: center; justify-content: center; 
                    font-size: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                }
                .celebration-text h4 { font-size: 1.125rem; font-weight: 800; color: #166534; margin: 0 0 0.15rem; }
                .celebration-text p { font-size: 0.9375rem; color: #14532d; font-weight: 500; margin: 0; opacity: 0.9; }
                .celebration-text p span { font-weight: 800; color: #166534; }
                @keyframes slideInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

                .item-name { font-weight: 600; color: #0f172a; text-align: left; }
                .product-info-cell { display: flex; align-items: center; gap: 1rem; }
                .product-name-block { display: flex; flex-direction: column; gap: 0.125rem; }
                .product-main-name { font-weight: 600; color: #0f172a; }
                .product-sku-sub { font-size: 0.75rem; color: #94a3b8; font-weight: 500; font-family: monospace; }
                .item-qty { font-weight: 700; color: #0f172a; text-align: right; }
                .item-price { font-weight: 600; color: #0f172a; text-align: right; }
                .product-thumb { width: 44px; height: 44px; border-radius: 8px; overflow: hidden; border: 1px solid #f1f5f9; background: #f8fafc; flex-shrink: 0; }
                .product-thumb img { width: 100%; height: 100%; object-fit: cover; }

                /* 👥 Assignment Styles */
                .assign-modal .staff-select { 
                    width: 100%; 
                    height: 48px; 
                    border-radius: 12px; 
                    border: 1px solid #e2e8f0; 
                    padding: 0 1rem; 
                    font-weight: 600; 
                    color: #1e293b;
                    appearance: auto;
                    font-family: inherit;
                }
                .assign-info-row { margin-top: 0.5rem; padding-top: 1rem; border-top: 1px dashed #f1f5f9; }
                .assigned-staff-badge { 
                    display: inline-flex; 
                    align-items: center; 
                    gap: 0.75rem; 
                    background: #fff7ed; 
                    color: #c2410c; 
                    padding: 0.5rem 1rem; 
                    border-radius: 999px; 
                    font-weight: 700;
                    border: 1px solid #ffedd5;
                    width: fit-content;
                }
                .assigned-staff-badge i { font-size: 1.125rem; }
                .assigned-time { font-size: 0.75rem; font-weight: 500; opacity: 0.7; margin-left: 0.25rem; }

                /* Mobile Items View (Hidden on Desktop) */
                .items-cards { display: none; flex-direction: column; gap: 1rem; }
                .item-card { background: #fff; border-radius: 16px; padding: 1.25rem; border: 1px solid #f1f5f9; }
                .item-card-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 0.75rem; }
                .item-card-img { width: 50px; height: 50px; border-radius: 10px; overflow: hidden; flex-shrink: 0; border: 1px solid #f1f5f9; }
                .item-card-img img { width: 100%; height: 100%; object-fit: cover; }
                .item-card-title-wrap { flex: 1; display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
                .item-card-name { font-weight: 700; color: #1e293b; line-height: 1.4; }
                .item-card-qty { font-weight: 800; color: #ffc451; background: #f8fafc; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem; border: 1px solid #e2e8f0; }
                .item-card-body { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px dashed #e2e8f0; }
                .item-card-sku { color: #94a3b8; font-size: 0.75rem; font-family: monospace; }
                .item-card-price { font-weight: 600; color: #475569; font-size: 0.9375rem; }
                .item-card-footer { display: flex; justify-content: space-between; align-items: center; }
                .item-card-subtotal-label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
                .item-card-subtotal-value { font-weight: 800; color: #0f172a; font-size: 1rem; }
                .items-mobile-total { margin-top: 1.5rem; padding: 1.5rem; background: #0f172a; border-radius: 16px; color: #fff; display: flex; justify-content: space-between; align-items: center; }
                .mobile-total-label { font-size: 0.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.8; }
                .mobile-total-value { font-size: 1.5rem; font-weight: 800; color: #ffc451; }
                /* 📱 Consolidated 2-Column Mobile UI */
                @media (max-width: 768px) {
                    .order-detail-container { padding: 1rem; background: #fafbfc; }
                    .detail-header { margin-bottom: 1.5rem; }
                    .back-link { margin-bottom: 1rem; color: #ffc451; font-weight: 700; background: #fffbeb; padding: 0.5rem 1rem; border-radius: 12px; display: inline-flex; }
                    .detail-header-row { flex-direction: column; align-items: stretch; gap: 1.5rem; }
                    .detail-header-title h1 { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.025em; }
                    .order-no { font-size: 0.875rem; color: #64748b; background: #f1f5f9; padding: 0.25rem 0.75rem; border-radius: 999px; margin-top: 0.5rem; display: inline-block; }

                    /* Action Buttons Grid */
                    .detail-header-actions { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; order: 2; }
                    .header-btn { width: 100%; height: 50px; border-radius: 14px; font-size: 1.15rem; background: #fff; border: 1px solid #e2e8f0; color: #1e293b; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: 0.2s; }
                    .header-btn.primary { background: #ffc451; border: none; color: #fff; box-shadow: 0 4px 12px rgba(255, 196, 81, 0.25); }
                    .header-btn:active { transform: scale(0.95); }

                    /* Unified Details Card (2-Column Grid) */
                    .detail-card { background: transparent; padding: 0; border: none; }
                    .detail-grid { 
                        display: grid; 
                        grid-template-columns: repeat(2, 1fr); 
                        gap: 1.25rem 1rem; 
                        background: #fff; 
                        border-radius: 24px; 
                        padding: 1.5rem; 
                        border: 1px solid #f1f5f9; 
                        box-shadow: 0 4px 10px rgba(0,0,0,0.03);
                    }
                    .detail-item { 
                        display: flex;
                        flex-direction: column;
                        gap: 0.25rem;
                        min-width: 0;
                    }
                    /* Full-Width Rows & Hidden Items */
                    .email-row, .address-row, .full-row {
                        grid-column: span 2;
                        padding-top: 0.5rem;
                    }
                    .total-amount-item { display: none; }
                    .address-row {
                        padding-top: 0.75rem;
                        border-top: 1px dashed #f1f5f9;
                    }
                    .detail-label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
                    .detail-value { font-size: 0.875rem; font-weight: 600; color: #0f172a; word-break: break-word; }
                    .detail-total { font-size: 1.125rem; font-weight: 800; color: #ffc451; }

                    /* Badges for Mobile */
                    .status-text { padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; margin-top: 0.15rem; width: fit-content; }
                    .status-text.status-success { background: #ecfdf5; color: #065f46; }
                    .status-text.status-warning { background: #fffbeb; color: #92400e; }
                    .status-text.status-info { background: #eff6ff; color: #1e40af; }
                    .status-text.status-pending { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }
                    .status-text.status-danger { background: #fef2f2; color: #991b1b; }
                    
                    .payment-status-text { font-size: 0.75rem; font-weight: 700; color: #94a3b8; }
                    .payment-status-text.paid { color: #16a34a; }
                    .payment-status-text.pending { color: #d97706; }

                    /* Items Section Items Items Cards */
                    .items-section { margin-top: 2rem; }
                    .items-title { font-size: 0.875rem; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.25rem; border-left: 4px solid #ffc451; padding-left: 0.75rem; }
                    
                    .items-table { display: none; }
                    .items-cards { display: grid; grid-template-columns: 1fr; gap: 1rem; }
                    .item-card { 
                        background: #fff; 
                        border-radius: 18px; 
                        padding: 1.25rem; 
                        border: 1px solid #f1f5f9; 
                        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
                    }
                    .item-card-header { display: flex; gap: 1rem; margin-bottom: 1.25rem; }
                    .item-card-img { width: 56px; height: 56px; border-radius: 12px; overflow: hidden; flex-shrink: 0; border: 1px solid #f1f5f9; }
                    .item-card-img img { width: 100%; height: 100%; object-fit: cover; }
                    .item-info { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }
                    .item-name-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
                    .item-card-name { font-size: 0.9375rem; font-weight: 700; color: #1e293b; line-height: 1.3; }
                    .item-qty-badge { background: #fffbeb; color: #b45309; padding: 0.2rem 0.5rem; border-radius: 6px; font-weight: 800; font-size: 0.7rem; border: 1px solid #fef3c7; }
                    .item-card-sku { color: #94a3b8; font-size: 0.7rem; font-weight: 500; }
                    
                    .item-price-details { display: flex; flex-direction: column; gap: 0.6rem; padding-top: 1rem; border-top: 1px dashed #f1f5f9; }
                    .price-row { display: flex; justify-content: space-between; align-items: center; }
                    .price-label { font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
                    .price-val { font-size: 0.9375rem; font-weight: 700; color: #475569; }
                    .price-row.total-row { padding-top: 0.2rem; }
                    .subtotal-val { color: #0f172a; font-size: 1.05rem; }

                    .items-mobile-total { 
                        background: #0f172a; 
                        border-radius: 20px; 
                        padding: 1.5rem; 
                        margin-top: 2rem;
                        box-shadow: 0 10px 25px -4px rgba(15, 23, 42, 0.2);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .mobile-total-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.7; color: #fff; }
                    .mobile-total-value { font-size: 1.35rem; font-weight: 800; color: #ffc451; }

                    .mobile-rewards-celebration {
                        margin-top: 1rem;
                        background: #f0fdf4;
                        border: 1px dashed #22c55e;
                        border-radius: 12px;
                        padding: 0.875rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #166534;
                        font-size: 0.85rem;
                        font-weight: 600;
                    }
                    .mobile-rewards-celebration b { font-weight: 800; }
                }

                @media (max-width: 480px) {
                    .detail-header-actions { grid-template-columns: repeat(5, 1fr); gap: 0.4rem; }
                    .header-btn { height: 44px; font-size: 1.125rem; }
                }
            `}</style>
        </div>
    );
}
