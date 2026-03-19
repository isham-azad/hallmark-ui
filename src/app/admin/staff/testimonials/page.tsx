import db from "@/lib/firebase";
import TestimonialsClient from "./TestimonialsClient";

export const dynamic = 'force-dynamic';

export default async function TestimonialsManagement() {
    const snap = await db.collection("testimonials").get();

    const testimonials = snap.docs
        .map((doc: any) => {
            const data = doc.data();
            const createdAt = data.createdAt?.toMillis?.() ?? 0;
            return {
                id: doc.id,
                name: data.name as string,
                role: data.role as string,
                quote: data.quote as string,
                rating: (data.rating as number) || 5,
                status: (data.status === "disabled" ? "disabled" : "active") as "active" | "disabled",
                _createdAt: createdAt,
            };
        })
        .sort((a: any, b: any) => b._createdAt - a._createdAt)
        .map(({ _createdAt, ...rest }: any) => rest);

    return <TestimonialsClient initialTestimonials={testimonials} />;
}
