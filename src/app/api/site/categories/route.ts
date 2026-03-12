import { NextResponse } from "next/server";
import db from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const snapshot = await db.collection("categories").get();
        const categories = snapshot.docs
            .map((doc: any) => {
                const data = doc.data();
                if (data.status === "disabled") return null;
                return {
                    id: doc.id,
                    name: data.name as string,
                    summary: (data.summary as string) ?? "",
                    image: (data.image as string) ?? "",
                };
            })
            .filter(Boolean);
        return NextResponse.json({ categories });
    } catch (error) {
        console.error("Site categories API error:", error);
        return NextResponse.json({ categories: [] });
    }
}
