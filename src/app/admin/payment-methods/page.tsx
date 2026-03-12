import db from "@/lib/firebase";
import PaymentMethodsClient from "./PaymentMethodsClient";

export const dynamic = "force-dynamic";

export default async function PaymentMethodsPage() {
    const snapshot = await db.collection("paymentMethods").orderBy("name", "asc").get();

    const paymentMethods = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name as string,
            summary: data.summary as string,
            status: data.status === "disabled" ? "disabled" : "active",
        };
    });

    return <PaymentMethodsClient initialPaymentMethods={paymentMethods} />;
}
