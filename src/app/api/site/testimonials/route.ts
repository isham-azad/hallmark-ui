import { NextResponse } from "next/server";
import db from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const snapshot = await db.collection("testimonials").get();
        const testimonials = snapshot.docs
            .map((doc: any) => {
                const data = doc.data();
                if (data.status === "disabled") return null;
                return {
                    id: doc.id,
                    name: data.name as string,
                    role: data.role as string,
                    quote: data.quote as string,
                    rating: (data.rating as number) || 5,
                    createdAt: data.createdAt?.toMillis?.() || 0,
                };
            })
            .filter(Boolean)
            // Sort by createdAt descending
            .sort((a: any, b: any) => b.createdAt - a.createdAt);

        return NextResponse.json({ testimonials });
    } catch (error) {
        console.error("Site testimonials API error:", error);
        return NextResponse.json({ testimonials: [] });
    }
}
