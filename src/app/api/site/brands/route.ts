import { NextResponse } from "next/server";
import db from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const snapshot = await db.collection("brands").get();
        const brands = snapshot.docs
            .map((doc: any) => {
                const data = doc.data();
                if (data.status === "disabled") return null;
                return {
                    id: doc.id,
                    name: data.name as string,
                    summary: (data.summary as string) ?? "",
                    image: (data.image as string) ?? "",
                    banner: (data.banner as string) ?? "",
                };
            })
            .filter(Boolean);
        return NextResponse.json({ brands });
    } catch (error) {
        console.error("Site brands API error:", error);
        return NextResponse.json({ brands: [] });
    }
}
