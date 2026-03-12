import { NextResponse } from "next/server";
import db from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const snapshot = await db.collection("paymentMethods").orderBy("name", "asc").get();

        const list = snapshot.docs
            .map((doc: any) => {
                const data = doc.data();
                if (data.status === "disabled") return null;
                return {
                    id: doc.id,
                    name: (data.name as string) ?? doc.id,
                    summary: (data.summary as string) ?? "",
                };
            })
            .filter(Boolean) as { id: string; name: string; summary: string }[];

        const isCod = (pm: { id: string; name: string }) => {
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
                nameLower.startsWith("cod ") ||
                (nameLower.includes("cod") && nameLower.includes("delivery"))
            );
        };
        const paymentMethods = [
            ...list.filter((pm) => !isCod(pm)),
            ...list.filter((pm) => isCod(pm)),
        ];

        return NextResponse.json({ paymentMethods });
    } catch (error) {
        console.error("Site payment methods API error:", error);
        return NextResponse.json({ paymentMethods: [] });
    }
}
