import { NextResponse } from "next/server";
import { getB2BSession } from "@/lib/b2b-auth";
import db from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getB2BSession();
        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }
        
        const clientDoc = await db.collection("b2b_clients").doc(session.id).get();
        const clientData = clientDoc.exists ? clientDoc.data() : null;
        
        return NextResponse.json({
            authenticated: true,
            user: {
                id: session.id,
                username: session.username,
                companyName: session.companyName,
                firstName: clientData?.firstName || "",
                lastName: clientData?.lastName || "",
                email: clientData?.email || "",
                phone: clientData?.phone || "",
                address: clientData?.address || "",
                city: clientData?.city || "",
                zip: clientData?.zip || "",
                rewardBalance: clientData?.rewardBalance || 0,
                rewardPercentage: clientData?.rewardPercentage !== undefined ? Number(clientData.rewardPercentage) : 2,
            }
        });
    } catch (e) {
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }
}
