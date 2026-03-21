import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { sendSms } from "@/lib/sms";

export const dynamic = "force-dynamic";

function generateOrderNo(): string {
    const n = Math.floor(100000 + Math.random() * 900000);
    return `#ORD-${n}`;
}

function normalizePaymentMethod(id?: string, name?: string): "COD" | "UPI" {
    const raw = `${(id || "").toLowerCase()} ${(name || "").toLowerCase()}`;
    if (/cod|cash|cash\s*on\s*delivery/.test(raw)) return "COD";
    return "UPI";
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            firstName,
            lastName,
            email,
            phone,
            address,
            city,
            zip,
            shippingName,
            shippingAddress,
            paymentMethodId,
            paymentMethodName,
            shipping,
            items,
        } = body as {
            firstName?: string;
            lastName?: string;
            email?: string;
            phone?: string;
            address?: string;
            city?: string;
            zip?: string;
            shippingName?: string;
            shippingAddress?: string;
            paymentMethodId?: string;
            paymentMethodName?: string;
            shipping?: number;
            items?: Array<{ id: string; name?: string; quantity: number; packSize?: string; price?: number; image?: string }>;
        };

        if (!email || !items?.length) {
            return NextResponse.json(
                { success: false, error: "Missing required fields: email, items." },
                { status: 400 }
            );
        }

        // Rate limiting: Prevent duplicate orders/SMS spam (60-second window)
        if (phone) {
            try {
                const normalizedPhone = String(phone).trim();
                const recentOrders = await db.collection("orders")
                    .where("phone", "==", normalizedPhone)
                    .orderBy("createdAt", "desc")
                    .limit(1)
                    .get();

                if (!recentOrders.empty) {
                    const lastOrder = recentOrders.docs[0].data();
                    const lastCreatedAt = lastOrder.createdAt?.toDate?.() || new Date(0);
                    const secondsSinceLast = (Date.now() - lastCreatedAt.getTime()) / 1000;

                    if (secondsSinceLast < 60) {
                        return NextResponse.json({
                            success: false,
                            error: "Please wait a minute before placing another order."
                        }, { status: 429 });
                    }
                }
            } catch (e) {
                console.warn("Rate-limit check skipped (likely missing Firestore index):", e);
                // Continue with order creation even if rate-limiting check fails
            }
        }

        const shippingAmount = shipping != null ? Number(shipping) : 0;
        const orderItems: { id: string; name: string; sku: string | null; qty: number; price: string; image: string | null; createdAt: string }[] = [];
        const itemCreatedAt = new Date().toISOString();
        let subtotalNum = 0;

        for (const item of items) {
            const itemId = item?.id != null ? String(item.id) : "";
            const qty = Number(item.quantity) || 1;
            let priceNum = 0;
            let name = "Product";
            try {
                const productDoc = await db.collection("products").doc(itemId).get();
                const data = productDoc.exists ? productDoc.data() : null;
                const priceStr = data?.price as string | undefined;
                priceNum = priceStr != null ? parseFloat(String(priceStr).replace(/[^0-9.]/g, "")) || 0 : 0;

                // Use the string price from the DB for display in admin
                const displayPrice = priceStr || (item.price != null ? `₹${item.price}` : "₹0");

                if (priceNum <= 0 && item.price != null) {
                    const fromItem = typeof item.price === "string" ? parseFloat(String(item.price).replace(/[^0-9.]/g, "")) : Number(item.price);
                    priceNum = fromItem || 0;
                }
                name = (data?.title as string) || item.name || "Product";
                const image = (data?.image as string)?.split(',')[0] || item.image || null;

                orderItems.push({
                    id: itemId,
                    name,
                    sku: item.packSize ?? null,
                    qty,
                    price: displayPrice,
                    image,
                    createdAt: itemCreatedAt,
                });
            } catch (e) {
                console.warn("Product lookup for item:", itemId, e);
                const fromItem = item.price != null ? (typeof item.price === "string" ? parseFloat(String(item.price).replace(/[^0-9.]/g, "")) : Number(item.price)) : 0;
                priceNum = fromItem || 0;
                const displayPrice = item.price != null ? `₹${item.price}` : "₹0";

                orderItems.push({
                    id: itemId,
                    name: item.name || "Product",
                    sku: item.packSize ?? null,
                    qty,
                    price: displayPrice,
                    image: item.image || null,
                    createdAt: itemCreatedAt,
                });
            }
            subtotalNum += priceNum * qty;
        }

        const totalNum = subtotalNum + shippingAmount;
        const customer = [firstName, lastName].filter(Boolean).join(" ") || "Guest";
        const orderNo = generateOrderNo();
        const paymentMethod = normalizePaymentMethod(paymentMethodId, paymentMethodName);

        const orderData: Record<string, unknown> = {
            orderNo,
            customer,
            email: String(email).trim(),
            phone: phone ? String(phone).trim() : null,
            address: address ? String(address).trim() : null,
            city: city ? String(city).trim() : null,
            zip: zip ? String(zip).trim() : null,
            shippingName: shippingName ? String(shippingName).trim() : null,
            shippingAddress: shippingAddress ? String(shippingAddress).trim() : null,
            total: `₹${totalNum.toFixed(2)}`,
            subtotal: `₹${subtotalNum.toFixed(2)}`,
            shippingAmount,
            status: "Pending",
            paymentMethod,
            paymentStatus: "Pending",
            payment: paymentMethod,
            date: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            items: orderItems,
        };

        const docRef = await db.collection("orders").add(orderData);

        // Update or create customer record with address details
        if (phone) {
            const customerData = {
                firstName: firstName || "",
                lastName: lastName || "",
                email: email || "",
                phone: String(phone).trim(),
                address: address || "",
                city: city || "",
                zip: zip || "",
                shippingName: shippingName || null,
                shippingAddress: shippingAddress || null,
                updatedAt: FieldValue.serverTimestamp(),
            };

            const customerSnap = await db.collection("customers").where("phone", "==", phone).limit(1).get();
            if (customerSnap.empty) {
                await db.collection("customers").add({
                    ...customerData,
                    createdAt: FieldValue.serverTimestamp(),
                });
            } else {
                await customerSnap.docs[0].ref.update(customerData);
            }
        }

        // Send confirmation SMS to customer
        if (phone) {
            try {
                let smsMessage = `Thank you for your order! Your order ${orderNo} of ${orderData.total} has been placed successfully. - HallMark`;

                if (paymentMethod === "UPI") {
                    const origin = request.nextUrl.origin;
                    const cleanNo = orderNo.replace(/^#/, "");
                    const paymentUrl = `${origin}/p?n=${cleanNo}&a=${totalNum.toFixed(2)}`;
                    smsMessage += `\n\nPay via: ${paymentUrl}`;
                }

                await sendSms(String(phone).trim(), smsMessage);
            } catch (smsError) {
                console.warn("Failed to send order confirmation SMS:", smsError);
                // Don't fail the request if SMS fails
            }
        }

        return NextResponse.json({
            success: true,
            orderId: docRef.id,
            orderNo,
            total: totalNum.toFixed(2),
            payment: String(orderData.payment),
        });
    } catch (error) {
        const err = error as Error & { code?: string };
        console.error("Create order error:", err?.message ?? error, err?.code, err?.stack);
        const isPermission = err?.code === "permission-denied" || err?.message?.includes("permission");
        const isAuth = err?.code === "unauthenticated" || err?.message?.includes("credential");
        const message = isPermission
            ? "Order could not be saved. Please try again or contact support."
            : isAuth
                ? "Server configuration error. Please try again later."
                : "Failed to create order. Please try again.";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const n = searchParams.get("n");

        if (!n) {
            return NextResponse.json({ success: false, error: "Missing order number" }, { status: 400 });
        }

        const queryValue = n.startsWith("#") ? n : `#${n}`;
        const orderSnap = await db.collection("orders")
            .where("orderNo", "==", queryValue)
            .limit(1)
            .get();


        if (orderSnap.empty) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        const data = orderSnap.docs[0].data();
        return NextResponse.json({
            success: true,
            status: data.status || "Pending",
            paymentStatus: data.paymentStatus || "Pending",
            total: data.total || "₹0.00",
        });
    } catch (error) {
        console.error("Fetch order error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

