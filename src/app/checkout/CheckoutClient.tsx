"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCart } from "@/context/CartContext";
import { PaymentMethodsShimmer } from "@/components/Shimmer";
import { useCartWithProducts } from "@/hooks/useCartWithProducts";
import { checkoutSchema, CheckoutFormData } from "@/lib/schemas";

interface PaymentMethodOption {
    id: string;
    name: string;
    summary: string;
}

function getPaymentIcon(id: string): string {
    const lower = id.toLowerCase();
    if (lower === "upi") return "bi-qr-code-scan";
    if (lower === "cod" || lower === "cash-on-delivery") return "bi-cash-coin";
    return "bi-credit-card";
}

function isCodPaymentMethod(pm: PaymentMethodOption): boolean {
    const idLower = pm.id.toLowerCase().trim();
    const nameLower = (pm.name || "").toLowerCase().trim();
    return (
        idLower === "cod" ||
        idLower === "cash-on-delivery" ||
        idLower === "cash on delivery" ||
        (idLower.includes("cash") && idLower.includes("deliver")) ||
        nameLower.includes("cash on delivery") ||
        nameLower.includes("cash on deliver") ||
        nameLower === "cod" ||
        (nameLower.includes("cod") && nameLower.includes("delivery"))
    );
}

function sortPaymentMethodsWithCodLast(list: PaymentMethodOption[]): PaymentMethodOption[] {
    const nonCod = list.filter((pm) => !isCodPaymentMethod(pm));
    const cod = list.filter((pm) => isCodPaymentMethod(pm));
    return [...nonCod, ...cod];
}

export default function CheckoutClient() {
    const router = useRouter();
    const { cart, clearCart } = useCart();
    const { cartWithDetails, cartTotalFromDb, totalSavings, loading: cartLoading, isB2B } = useCartWithProducts(cart);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            zip: "",
            shippingName: "",
            shippingAddress: "",
        },
    });

    const formValues = watch();

    useEffect(() => {
        if (!cartLoading && !isB2B) {
            router.push("/b2b/login");
        }
    }, [cartLoading, isB2B, router]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<string>("");
    const [showShipping, setShowShipping] = useState(false);
    const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [pincodeStatus, setPincodeStatus] = useState<"none" | "checking" | "available" | "unavailable">("none");
    const [checkoutStep, setCheckoutStep] = useState<"mobile" | "otp" | "billing">("mobile");
    const [otp, setOtp] = useState("");
    const [isVerifyingMobile, setIsVerifyingMobile] = useState(false);
    const [mobileStatus, setMobileStatus] = useState<string | null>(null);
    const [showOtp, setShowOtp] = useState(false);
    const [otpTest, setOtpTest] = useState("");
    const [rewardBalance, setRewardBalance] = useState(0);
    const [applyRewards, setApplyRewards] = useState(false);
    const [rewardAmount, setRewardAmount] = useState<string>("");
    const [voucherCode, setVoucherCode] = useState("");
    const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
    const [voucherLoading, setVoucherLoading] = useState(false);
    const [voucherError, setVoucherError] = useState("");

    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) return;
        setVoucherLoading(true);
        setVoucherError("");
        try {
            const res = await fetch("/api/b2b/voucher", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: voucherCode.trim() })
            });
            const data = await res.json();
            if (data.success) {
                setAppliedVoucher(data.voucher);
                setVoucherError("");
            } else {
                setVoucherError(data.error || "Invalid voucher code");
            }
        } catch (err) {
            setVoucherError("Failed to validate voucher");
        } finally {
            setVoucherLoading(false);
        }
    };
    useEffect(() => {
        if (isB2B) {
            fetch("/api/b2b/me").then(r => r.json()).then(res => {
                if (res.user) {
                    if (res.user.rewardBalance) {
                        setRewardBalance(res.user.rewardBalance);
                    }
                    // Pre-fill form with B2B data
                    if (res.user.firstName || res.user.companyName) setValue("firstName", res.user.firstName || res.user.companyName);
                    if (res.user.lastName) setValue("lastName", res.user.lastName);
                    if (res.user.email) setValue("email", res.user.email);
                    if (res.user.phone) setValue("phone", res.user.phone);
                    if (res.user.address) setValue("address", res.user.address);
                    if (res.user.city) setValue("city", res.user.city);
                    if (res.user.zip) setValue("zip", res.user.zip);
                }
            }).catch(console.error);
        }
    }, [isB2B]);

    useEffect(() => {
        if (isB2B && checkoutStep === "mobile") {
             setCheckoutStep("billing");
             // Also pre-fill phone if available from session? 
             // For now just skip verification as requested.
        }
    }, [isB2B, checkoutStep]);

    useEffect(() => {
        fetch("/api/site/payment-methods")
            .then((r) => r.json())
            .then((res) => {
                const list = (res.paymentMethods ?? []) as PaymentMethodOption[];
                const sorted = sortPaymentMethodsWithCodLast(list);
                setPaymentMethods(sorted);
                if (sorted.length > 0) {
                    const upiFirst = sorted.find((pm) => pm.id.toLowerCase() === "upi");
                    setPaymentMethod(upiFirst ? upiFirst.id : sorted[0].id);
                }
            })
            .catch(() => setPaymentMethods([]))
            .finally(() => setPaymentMethodsLoading(false));
    }, []);

    const shipping = 0;
    const rewardsDeducted = (isB2B && applyRewards) ? Math.min(rewardBalance, Number(rewardAmount) || 0, cartTotalFromDb + shipping) : 0;
    const totalBeforeVoucher = cartTotalFromDb + shipping - rewardsDeducted;
    const voucherDeducted = appliedVoucher ? Math.min(appliedVoucher.balance, totalBeforeVoucher) : 0;
    const total = totalBeforeVoucher - voucherDeducted;
    const paymentMethodLabel = paymentMethods.find((pm) => pm.id === paymentMethod)?.name ?? paymentMethod;


    const checkPincode = async () => {
        const zip = formValues.zip.trim().replace(/\D/g, "");
        if (zip.length !== 6) {
            setSubmitError("Please enter a valid 6-digit pincode to check delivery.");
            return;
        }
        setPincodeStatus("checking");
        setSubmitError(null);
        try {
            const res = await fetch(`/api/site/check-pincode?pincode=${encodeURIComponent(zip)}`);
            const data = await res.json();
            setPincodeStatus(data.available ? "available" : "unavailable");
        } catch {
            setPincodeStatus("unavailable");
        }
    };

    const sendMobileOtp = async () => {
        if (!formValues.phone.trim()) {
            setSubmitError("Please enter your mobile number.");
            return;
        }
        const zip = formValues.zip.trim().replace(/\D/g, "");
        if (zip.length !== 6) {
            setSubmitError("Please enter a valid 6-digit pincode to check delivery availability.");
            return;
        }

        setIsVerifyingMobile(true);
        setSubmitError(null);
        setMobileStatus(null);
        try {
            // First check if delivery is available
            const pcRes = await fetch(`/api/site/check-pincode?pincode=${encodeURIComponent(zip)}`);
            const pcData = await pcRes.json();

            if (!pcData.available) {
                setSubmitError("Sorry, we currently do not deliver to this pincode. Please try a different location.");
                setIsVerifyingMobile(false);
                return;
            }

            // If available, send OTP
            const res = await fetch("/api/site/otp/send-mobile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: formValues.phone.trim() }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setCheckoutStep("otp");
                setMobileStatus("OTP sent successfully! Please check your mobile phone.");
                setPincodeStatus("available");
                setShowOtp(false);
            } else if (data.otp) {
                // for testing purpose need to show the OTP in the OTP screen
                setCheckoutStep("otp");
                setSubmitError(data.error || "Failed to send OTP. Please try again.");
                setOtpTest(data.otp);
                setShowOtp(true);
            } else {
                setSubmitError(data.error || "Failed to send OTP. Please try again.");
            }
        } catch {
            setSubmitError("Something went wrong. Please try again.");
        } finally {
            setIsVerifyingMobile(false);
        }
    };

    const verifyMobileOtp = async () => {
        if (!otp.trim()) {
            setSubmitError("Please enter the OTP.");
            return;
        }
        setIsVerifyingMobile(true);
        setSubmitError(null);
        try {
            const res = await fetch("/api/site/otp/verify-mobile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: formValues.phone.trim(), otp: otp.trim() }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setCheckoutStep("billing");
                if (data.customerData) {
                    if (data.customerData.firstName) setValue("firstName", data.customerData.firstName);
                    if (data.customerData.lastName) setValue("lastName", data.customerData.lastName);
                    if (data.customerData.email) setValue("email", data.customerData.email);
                    if (data.customerData.address) setValue("address", data.customerData.address);
                    if (data.customerData.city) setValue("city", data.customerData.city);
                    if (data.customerData.zip) setValue("zip", data.customerData.zip);
                    if (data.customerData.shippingName) setValue("shippingName", data.customerData.shippingName);
                    if (data.customerData.shippingAddress) setValue("shippingAddress", data.customerData.shippingAddress);
                    if (data.customerData.shippingAddress && data.customerData.shippingAddress !== data.customerData.address) {
                        setShowShipping(true);
                    }
                }
            } else {
                setSubmitError(data.error || "Invalid OTP. Please try again.");
            }
        } catch {
            setSubmitError("Something went wrong. Please try again.");
        } finally {
            setIsVerifyingMobile(false);
        }
    };

    const zipDigits = formValues.zip.trim().replace(/\D/g, "").length;
    const pincodeRequired = zipDigits === 6;
    const canPlaceOrder = isB2B || !pincodeRequired || pincodeStatus === "available";

    const onSubmit = async (data: CheckoutFormData) => {
        if (!canPlaceOrder) {
            setSubmitError("Please check delivery availability for your pincode before placing the order.");
            return;
        }
        setSubmitError(null);
        setSubmitting(true);
        try {
            const res = await fetch("/api/site/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: data.firstName.trim(),
                    lastName: data.lastName.trim(),
                    email: data.email.trim(),
                    phone: data.phone.trim(),
                    address: data.address.trim(),
                    city: data.city.trim(),
                    zip: data.zip.trim(),
                    shippingName: showShipping ? data.shippingName?.trim() : undefined,
                    shippingAddress: showShipping ? data.shippingAddress?.trim() : undefined,
                    paymentMethodId: paymentMethod,
                    paymentMethodName: paymentMethodLabel,
                    subtotal: cartTotalFromDb,
                    shipping,
                    total,
                    applyRewards: isB2B && applyRewards,
                    appliedVoucherId: appliedVoucher?.id || null,
                    voucherAmount: voucherDeducted,
                    items: cartWithDetails.map((item) => ({
                        id: String(item.id),
                        name: item.nameFromDb,
                        quantity: item.quantity,
                        packSize: item.packSize,
                        price: item.priceFromDb,
                        sku: item.sku || null,
                    })),
                }),
            });
            const responseData = await res.json();
            if (!res.ok || !responseData.success) {
                setSubmitError(responseData.error || "Failed to place order.");
                setSubmitting(false);
                return;
            }
            clearCart();
            const params = new URLSearchParams({
                orderNo: responseData.orderNo || "",
                total: String(responseData.total ?? total.toFixed(2)),
                payment: responseData.payment || paymentMethodLabel,
                rewardsEarned: String(responseData.rewardsEarned || 0),
                rewardsUsed: String(responseData.rewardsUsed || 0),
                voucherUsed: String(responseData.voucherAmount || 0),
            });
            router.push(`/order-success?${params.toString()}`);
        } catch {
            setSubmitError("Something went wrong. Please try again.");
            setSubmitting(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="container text-center d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "70vh", paddingTop: "120px", paddingBottom: "60px" }}>
                <div className="empty-cart-icon-wrapper mb-4">
                    <i className="bi bi-cart-x text-muted" style={{ fontSize: "80px", opacity: 0.2 }}></i>
                </div>
                <h2 className="fw-bold">Your cart is empty</h2>
                <p className="text-muted mb-4">You cannot checkout with an empty cart. Please add some products first.</p>
                <Link href="/shop" className="btn btn-primary btn-lg px-5 shadow-sm">
                    <i className="bi bi-arrow-left me-2"></i>Go to Shop
                </Link>
            </div>
        );
    }

    if (!cartLoading && !isB2B) {
        return null; // Don't flash checkout content while redirecting
    }

    return (
        <>
            <div className="page-title" style={{ marginTop: "100px" }} data-aos="fade">
                <div className="heading">
                    <div className="container">
                        <div className="row d-flex justify-content-center text-center">
                            <div className="col-lg-8">
                                <h1>Checkout</h1>
                                <p className="mb-0">Complete your order</p>
                            </div>
                        </div>
                    </div>
                </div>
                <nav className="breadcrumbs">
                    <div className="container">
                        <ol>
                            <li><Link href="/">Home</Link></li>
                            <li><Link href="/shop">Shop</Link></li>
                            <li><Link href="/cart">Cart</Link></li>
                            <li className="current">Checkout</li>
                        </ol>
                    </div>
                </nav>
            </div>

            <section id="checkout" className="checkout section">
                <div className="container" data-aos="fade-up" data-aos-delay="100">
                    {cartLoading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3 text-muted">Preparing checkout...</p>
                        </div>
                    ) : (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="row">
                            <div className="col-lg-8">
                                <div className="checkout-form bg-white p-4 rounded shadow-sm border">
                                    {checkoutStep === "mobile" && (
                                        <div className="checkout-section py-4">
                                            <h3 className="mb-4 fw-bold border-bottom pb-2">Step 1: Pincode & Mobile Verification</h3>
                                            {submitError && <div className="alert alert-danger mb-4">{submitError}</div>}

                                            <div className="mb-5">
                                                <div className="pincode-check-card rounded-3 border p-4" style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}>
                                                    <label className="form-label fw-semibold mb-2 d-flex align-items-center gap-2">
                                                        <i className="bi bi-geo-alt-fill text-primary" />
                                                        Delivery Pincode <span className="text-danger">*</span>
                                                    </label>
                                                    <p className="small text-muted mb-3">Enter your 6-digit pincode to check delivery availability.</p>
                                                    <div className="d-flex gap-2 align-items-center">
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            className={`form-control form-control-lg ${errors.zip ? 'is-invalid' : ''}`}
                                                            style={{ backgroundColor: "#fff", flex: "1", minWidth: "120px" }}
                                                            {...register("zip", { 
                                                                onChange: () => { setPincodeStatus("none"); setSubmitError(null); } 
                                                            })}
                                                            placeholder="679577"
                                                            maxLength={6}
                                                            disabled={pincodeStatus === "available"}
                                                        />
                                                        {pincodeStatus !== "available" && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary px-4 text-nowrap flex-shrink-0"
                                                                onClick={checkPincode}
                                                                disabled={formValues.zip.length !== 6 || pincodeStatus === "checking"}
                                                                style={{ height: "48px" }}
                                                            >
                                                                {pincodeStatus === "checking" ? (
                                                                    <span className="spinner-border spinner-border-sm" role="status" />
                                                                ) : (
                                                                    <><i className="bi bi-truck me-1" />Check delivery</>
                                                                )}
                                                            </button>
                                                        )}
                                                        {pincodeStatus === "available" && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-secondary btn-sm ms-2"
                                                                onClick={() => { setPincodeStatus("none"); setValue("zip", ""); }}
                                                            >
                                                                Change
                                                            </button>
                                                        )}
                                                    </div>
                                                    {pincodeStatus === "available" && (
                                                        <div className="alert alert-success py-2 px-3 mt-3 mb-0 small d-flex align-items-center gap-2 rounded-2">
                                                            <i className="bi bi-check-circle-fill" />
                                                            <span>Delivery available! Now enter your mobile number.</span>
                                                        </div>
                                                    )}
                                                    {pincodeStatus === "unavailable" && (
                                                        <div className="alert alert-danger py-2 px-3 mt-3 mb-0 small d-flex align-items-center gap-2 rounded-2">
                                                            <i className="bi bi-x-circle-fill" />
                                                            <span>Sorry, we don’t deliver to this area.</span>
                                                            {errors.zip && <div className="text-danger small mt-2">{errors.zip.message}</div>}
                                                </div>
                                                    )}
                                                </div>
                                            </div>

                                            {pincodeStatus === "available" && (
                                                <div className="animate__animated animate__fadeIn">
                                                    <div className="mb-4">
                                                        <label className="form-label fw-semibold">Mobile Number <span className="text-danger">*</span></label>
                                                        <div className="input-group">
                                                            <span className="input-group-text bg-light">+91</span>
                                                            <input
                                                                type="tel"
                                                                className={`form-control form-control-lg ${errors.phone ? 'is-invalid' : ''}`}
                                                                placeholder="9876543210"
                                                                {...register("phone", {
                                                                    onChange: () => setSubmitError(null)
                                                                })}
                                                            />
                                                        </div>
                                                        <p className="small text-muted mt-2">We'll send an OTP to verify your number.</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary btn-lg w-100 fw-bold py-3"
                                                        onClick={sendMobileOtp}
                                                        disabled={isVerifyingMobile || !formValues.phone}
                                                    >
                                                        {isVerifyingMobile ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                                                        Send OTP
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {checkoutStep === "otp" && (
                                        <div className="checkout-section py-4">
                                            <h3 className="mb-4 fw-bold border-bottom pb-2">Verify OTP</h3>
                                            {submitError && <div className="alert alert-danger mb-4">{submitError}</div>}
                                            {mobileStatus && <div className="alert alert-success mb-4 small">{mobileStatus}</div>}
                                            <div className="mb-4 text-center">
                                                <p className="mb-3">Enter the 6-digit OTP sent to <strong>+91 {formValues.phone}</strong></p>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg text-center fw-bold letter-spacing-lg"
                                                    style={{ letterSpacing: "8px", fontSize: "2rem" }}
                                                    maxLength={6}
                                                    placeholder="000000"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                                    autoFocus
                                                />
                                            </div>
                                            {showOtp && (
                                                <div className="alert alert-info py-2 px-3 mb-4 text-center border-info border-opacity-25" style={{ backgroundColor: 'rgba(13, 202, 240, 0.05)' }}>
                                                    <i className="bi bi-info-circle me-2"></i>
                                                    <strong>Test OTP:</strong> <span className="badge bg-info text-dark ms-1" style={{ fontSize: '1.1rem', letterSpacing: '2px' }}>{otpTest}</span>
                                                </div>
                                            )}
                                            <div className="d-flex gap-3">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary btn-lg flex-grow-1"
                                                    onClick={() => setCheckoutStep("mobile")}
                                                >
                                                    Back
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary btn-lg flex-grow-2 w-100 fw-bold"
                                                    onClick={verifyMobileOtp}
                                                    disabled={isVerifyingMobile || otp.length !== 6}
                                                >
                                                    {isVerifyingMobile ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                                                    Verify & Continue
                                                </button>
                                            </div>
                                            <div className="text-center mt-4">
                                                <button type="button" className="btn btn-link btn-sm text-decoration-none" onClick={sendMobileOtp}>
                                                    Didn't receive OTP? Resend
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {checkoutStep === "billing" && (
                                        <div className="checkout-section">
                                            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                                                <h3 className="mb-0 fw-bold">Billing Information</h3>
                                                <div className="text-success small d-flex align-items-center gap-1">
                                                    <i className="bi bi-patch-check-fill" /> Verified: {formValues.phone}
                                                </div>
                                            </div>
                                            {submitError && (
                                                <div className="alert alert-danger mb-4" role="alert">
                                                    {submitError}
                                                </div>
                                            )}
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-semibold">First Name <span className="text-danger">*</span></label>
                                                    <input type="text" className={`form-control ${errors.firstName ? 'is-invalid' : ''}`} placeholder="John" style={{ backgroundColor: "#fff" }} {...register("firstName")} />
                                                    {errors.firstName && <div className="invalid-feedback">{errors.firstName.message}</div>}
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-semibold">Last Name <span className="text-danger">*</span></label>
                                                    <input type="text" className={`form-control ${errors.lastName ? 'is-invalid' : ''}`} placeholder="Doe" style={{ backgroundColor: "#fff" }} {...register("lastName")} />
                                                    {errors.lastName && <div className="invalid-feedback">{errors.lastName.message}</div>}
                                                </div>
                                                <div className="col-md-12 mb-3">
                                                    <label className="form-label fw-semibold">Email Address <span className="text-danger">*</span></label>
                                                    <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} placeholder="john@example.com" style={{ backgroundColor: "#fff" }} {...register("email")} />
                                                    {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                                                </div>
                                                <div className="col-md-12 mb-3">
                                                    <label className="form-label fw-semibold">Phone Number <span className="text-danger">*</span></label>
                                                    <input type="tel" className="form-control" placeholder="+91 98765 43210" disabled style={{ backgroundColor: "#f8fafc" }} {...register("phone")} />
                                                </div>
                                                <div className="col-md-12 mb-3">
                                                    <label className="form-label fw-semibold">Delivery Address <span className="text-danger">*</span></label>
                                                    <textarea className={`form-control ${errors.address ? 'is-invalid' : ''}`} rows={3} placeholder="Apartment, Street, Area" style={{ backgroundColor: "#fff" }} {...register("address")}></textarea>
                                                    {errors.address && <div className="invalid-feedback">{errors.address.message}</div>}
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-semibold">City <span className="text-danger">*</span></label>
                                                    <input type="text" className={`form-control ${errors.city ? 'is-invalid' : ''}`} style={{ backgroundColor: "#fff" }} {...register("city")} />
                                                    {errors.city && <div className="invalid-feedback">{errors.city.message}</div>}
                                                </div>
                                                <div className="col-12 mb-3">
                                                    <div className="pincode-check-card rounded-3 border p-4" style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}>
                                                        <label className="form-label fw-semibold mb-2 d-flex align-items-center gap-2">
                                                            <i className="bi bi-geo-alt-fill text-primary" />
                                                            Pincode <span className="text-danger">*</span>
                                                        </label>
                                                        <div className="d-flex gap-2 align-items-center">
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                className={`form-control ${errors.zip ? 'is-invalid' : ''}`}
                                                                disabled={pincodeStatus === "available" && !isB2B}
                                                                style={{ backgroundColor: (pincodeStatus === "available" && !isB2B) ? "#f1f5f9" : "#fff", flex: "1", minWidth: "80px" }}
                                                                {...register("zip", { 
                                                                    onChange: () => { setPincodeStatus("none"); setSubmitError(null); } 
                                                                })}
                                                                placeholder="679577"
                                                                maxLength={6}
                                                            />
                                                            {(pincodeStatus === "available" && !isB2B) && (
                                                                <div className="text-success small d-flex align-items-center gap-1">
                                                                    <i className="bi bi-patch-check-fill" /> Verified
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {checkoutStep === "billing" && (
                                        <div className="checkout-section mb-5">
                                            <div className="form-check mb-3">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="same-as-billing"
                                                    checked={!showShipping}
                                                    onChange={() => setShowShipping(!showShipping)}
                                                />
                                                <label className="form-check-label fw-semibold" htmlFor="same-as-billing">
                                                    Shipping address is the same as billing address
                                                </label>
                                            </div>
                                            {showShipping && (
                                                <div className="shipping-info-fields mt-4 animate__animated animate__fadeIn">
                                                    <h4 className="mb-4">Shipping Information</h4>
                                                    <div className="row">
                                                        <div className="col-md-12 mb-3">
                                                            <label className="form-label">Full Name</label>
                                                            <input type="text" className="form-control" style={{ backgroundColor: "#fff" }} {...register("shippingName")} />
                                                        </div>
                                                        <div className="col-md-12 mb-3">
                                                            <label className="form-label">Shipping Address</label>
                                                            <textarea className="form-control" rows={2} style={{ backgroundColor: "#fff" }} {...register("shippingAddress")}></textarea>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {checkoutStep === "billing" && (
                                        <div className="checkout-section">
                                            <h3 className="mb-4 fw-bold border-bottom pb-2">Payment Method</h3>
                                            <div className="payment-methods d-flex flex-column gap-3">
                                                {paymentMethodsLoading ? (
                                                    <PaymentMethodsShimmer />
                                                ) : paymentMethods.length === 0 ? (
                                                    <p className="text-muted small mb-0">No payment methods available. Please try again later.</p>
                                                ) : (
                                                    paymentMethods.map((pm) => (
                                                        <div
                                                            key={pm.id}
                                                            className={`payment-item p-4 rounded-3 border-2 shadow-sm position-relative ${paymentMethod === pm.id ? "active" : ""}`}
                                                            onClick={() => setPaymentMethod(pm.id)}
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            <div className="d-flex align-items-center mb-0">
                                                                <div className="custom-radio me-3 flex-shrink-0"></div>
                                                                <div className={`icon-box p-3 rounded-circle me-3 d-flex align-items-center justify-content-center ${paymentMethod === pm.id ? "bg-primary text-white" : "bg-light text-muted"}`} style={{ width: "50px", height: "50px" }}>
                                                                    <i className={`bi ${getPaymentIcon(pm.id)} fs-4`}></i>
                                                                </div>
                                                                <div className="flex-grow-1">
                                                                    <h5 className="mb-1 fw-bold h6">{pm.name}</h5>
                                                                    <p className="mb-0 text-muted small">{pm.summary || "Secure payment option."}</p>
                                                                </div>
                                                                {pm.id.toLowerCase() === "upi" && (
                                                                    <div className="ms-auto d-none d-sm-block">
                                                                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2">
                                                                            <i className="bi bi-lightning-charge-fill me-1"></i> Fast
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-lg-4">
                                <div className="order-summary p-4 border rounded shadow-sm bg-white sticky-lg-top" style={{ zIndex: 10 }}>
                                    <h4 className="mb-4 fw-bold">Order Summary</h4>
                                    <div className="order-items mb-3 overflow-auto" style={{ maxHeight: "300px" }}>
                                        {cartWithDetails.map((item) => (
                                            <div key={`${item.id}-${item.packSize}`} className="order-item d-flex align-items-center gap-3 mb-3 border-bottom pb-2">
                                                <div className="flex-shrink-0 bg-white rounded" style={{ width: "50px", height: "50px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                                                    <img
                                                        src={item.imageFromDb ? item.imageFromDb.split(',').filter(Boolean)[0] : (item.image || "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566376/hallmark/assets/img/masonry-portfolio/masonry-portfolio-1.jpg")}
                                                        alt={item.nameFromDb}
                                                        className="img-fluid w-100 h-100"
                                                        style={{ objectFit: "contain", width: "100%", height: "100%", padding: "4px" }}
                                                    />
                                                </div>
                                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                                    <div className="fw-bold small text-truncate" title={item.nameFromDb}>{item.nameFromDb}</div>
                                                    <p className="small text-muted mb-0" style={{ fontSize: '0.7rem' }}>
                                                        Qty: {item.quantity} {item.packSize && item.packSize.toLowerCase() !== "standard" && ` | ${item.packSize}`}
                                                    </p>
                                                    {isB2B && item.originalPriceFromDb > item.priceFromDb && (
                                                        <div className="text-success fw-bold" style={{ fontSize: '0.65rem' }}>
                                                            MRP Profit: ₹{((item.originalPriceFromDb - item.priceFromDb) * item.quantity).toFixed(2)} ({Math.round(((item.originalPriceFromDb - item.priceFromDb) / item.priceFromDb) * 100)}%)
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-end flex-shrink-0">
                                                    {item.originalPriceFromDb > item.priceFromDb && (
                                                        <div className="text-muted" style={{ fontSize: '0.6rem' }}>MRP: ₹{(item.originalPriceFromDb * item.quantity).toFixed(2)}</div>
                                                    )}
                                                    <div className="fw-bold small text-nowrap">
                                                        <span className="text-muted" style={{ fontSize: '0.6rem', fontWeight: 'normal' }}>Your Price: </span>
                                                        ₹{(item.priceFromDb * item.quantity).toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="summary-item d-flex justify-content-between mb-2">
                                        <span>{isB2B ? "MRP Total:" : "Subtotal:"}</span>
                                        <span className="fw-bold">{cartLoading ? "—" : `₹${(cartTotalFromDb + totalSavings).toFixed(2)}`}</span>
                                    </div>
                                    {totalSavings > 0 && (
                                        <div className="summary-item d-flex justify-content-between mb-2 text-success" style={{ fontSize: "0.9rem" }}>
                                            <span>{isB2B ? "MRP Profit:" : "Volume Savings:"}</span>
                                            <span className="fw-bold">₹{totalSavings.toFixed(2)} ({Math.round((totalSavings / (isB2B ? cartTotalFromDb : (cartTotalFromDb + totalSavings))) * 100)}%)</span>
                                        </div>
                                    )}
                                    {isB2B && rewardBalance > 0 && (
                                        <div className="mb-3 p-3 bg-light rounded border border-warning" style={{ fontSize: "0.9rem" }}>
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <div className="fw-bold text-dark"><i className="bi bi-gift-fill text-warning me-2"></i>Reward Balance</div>
                                                <div className="fw-bold text-success">₹{(rewardBalance).toFixed(2)}</div>
                                            </div>
                                            <div className="form-check form-switch mt-2">
                                                <input className="form-check-input" type="checkbox" id="applyRewards" checked={applyRewards} onChange={(e) => {
                                                    setApplyRewards(e.target.checked);
                                                    if (e.target.checked) setRewardAmount(Math.min(rewardBalance, cartTotalFromDb + shipping).toFixed(2));
                                                }} />
                                                <label className="form-check-label text-muted small" htmlFor="applyRewards">Apply rewards to this order</label>
                                            </div>

                                            {applyRewards && (
                                                <div className="reward-input-wrapper mt-3 animate__animated animate__fadeIn">
                                                    <label className="small text-muted mb-1 d-block">Enter points to use (Max ₹{Math.min(rewardBalance, cartTotalFromDb + shipping).toFixed(2)})</label>
                                                    <div className="input-group input-group-sm">
                                                        <span className="input-group-text bg-white border-warning text-warning">₹</span>
                                                        <input 
                                                            type="number" 
                                                            className="form-control border-warning shadow-none" 
                                                            value={rewardAmount}
                                                            onChange={(e) => {
                                                                const val = Number(e.target.value);
                                                                const max = Math.min(rewardBalance, cartTotalFromDb + shipping);
                                                                if (val > max) {
                                                                    setRewardAmount(max.toFixed(2));
                                                                } else {
                                                                    setRewardAmount(e.target.value);
                                                                }
                                                            }}
                                                            max={Math.min(rewardBalance, cartTotalFromDb + shipping)}
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {applyRewards && rewardsDeducted > 0 && (
                                                <div className="d-flex justify-content-between mt-2 pt-2 border-top border-warning text-success fw-bold">
                                                    <span>Rewards Used:</span>
                                                    <span>-₹{rewardsDeducted.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {isB2B && (
                                        <div className="mb-3 p-3 bg-white rounded border" style={{ borderColor: appliedVoucher ? '#22c55e' : (voucherError ? '#ef4444' : '#e2e8f0') }}>
                                            <div className="fw-bold text-dark small mb-2">Have a Gift Voucher?</div>
                                            <div className="input-group input-group-sm">
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    placeholder="Enter code (xxxx-xxxx-xxxx)" 
                                                    value={voucherCode} 
                                                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                                    disabled={appliedVoucher || voucherLoading}
                                                />
                                                {!appliedVoucher ? (
                                                    <button 
                                                        className="btn btn-dark" 
                                                        type="button" 
                                                        onClick={handleApplyVoucher}
                                                        disabled={!voucherCode || voucherLoading}
                                                    >
                                                        {voucherLoading ? <span className="spinner-border spinner-border-sm" /> : "Apply"}
                                                    </button>
                                                ) : (
                                                    <button 
                                                        className="btn btn-outline-danger" 
                                                        type="button" 
                                                        onClick={() => { setAppliedVoucher(null); setVoucherCode(""); }}
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                            {voucherError && <div className="text-danger smaller mt-1" style={{ fontSize: '0.7rem' }}>{voucherError}</div>}
                                            {appliedVoucher && (
                                                <div className="d-flex justify-content-between mt-2 pt-2 border-top text-success fw-bold">
                                                    <span>Voucher Benefit:</span>
                                                    <span>-₹{Math.min(appliedVoucher.balance, totalBeforeVoucher).toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <hr />
                                    <div className="summary-total d-flex justify-content-between mb-4">
                                        <span className="h5 fw-bold">Total:</span>
                                        <strong className="text-primary h4 mb-0">{cartLoading ? "—" : `₹${Math.max(0, total).toFixed(2)}`}</strong>
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-lg w-100 mb-3 fw-bold py-3 shadow-sm"
                                        disabled={checkoutStep !== "billing" || paymentMethodsLoading || paymentMethods.length === 0 || !paymentMethod || submitting || !canPlaceOrder}
                                    >
                                        {submitting ? "Placing Order…" : "Place Your Order"}
                                    </button>
                                    <div className="text-center">
                                        <Link href="/cart" className="text-decoration-none small">
                                            <i className="bi bi-arrow-left me-1"></i>Edit Cart
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                    )}
                </div>
            </section>

            {/* Sticky Mobile Action Bar */}
            {checkoutStep === "billing" && !cartLoading && (
                <div className="mobile-action-bar d-md-none border-top shadow-lg">
                    <div className="container-fluid py-3 px-4">
                        <div className="d-flex align-items-center justify-content-between gap-3">
                            <div className="price-info">
                                <div className="small text-white-50 lh-1">Total Amount</div>
                                <div className="h5 fw-bold text-white mb-0">₹{total.toFixed(2)}</div>
                            </div>
                            <button
                                type="button"
                                className="btn btn-warning flex-grow-1 fw-bold py-2 shadow-sm rounded-pill"
                                onClick={() => {
                                    const formEl = document.querySelector('form');
                                    if (formEl) formEl.requestSubmit();
                                }}
                                disabled={submitting || !canPlaceOrder}
                                style={{ backgroundColor: '#ffc451', color: '#111', fontSize: '0.95rem' }}
                            >
                                {submitting ? "Processing..." : "Place Order"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .mobile-action-bar {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    z-index: 1050;
                    background: #111;
                    padding-bottom: env(safe-area-inset-bottom);
                }
                .mobile-action-bar .btn-warning:active {
                    transform: scale(0.98);
                }
                .form-control::placeholder {
                    color: #cbd5e1 !important;
                    opacity: 1;
                }
                .letter-spacing-lg {
                    letter-spacing: 0.5rem;
                }
                @media (max-width: 767.98px) {
                    section.checkout {
                        padding-bottom: 100px !important;
                    }
                }
            `}</style>
        </>
    );
}
