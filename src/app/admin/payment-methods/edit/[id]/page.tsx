import db from "@/lib/firebase";
import PaymentMethodEditClient from "./PaymentMethodEditClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditPaymentMethodPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;

    const doc = await db.collection("paymentMethods").doc(id).get();

    if (!doc.exists) {
        notFound();
    }

    const data = doc.data()!;
    const paymentMethod = {
        id: doc.id,
        name: data.name as string,
        summary: data.summary as string,
    };

    return <PaymentMethodEditClient paymentMethod={paymentMethod} />;
}
