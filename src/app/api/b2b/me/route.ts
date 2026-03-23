import { NextResponse } from "next/server";
import { getB2BSession } from "@/lib/b2b-auth";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getB2BSession();
        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }
        
        return NextResponse.json({
            authenticated: true,
            user: {
                id: session.id,
                username: session.username,
                companyName: session.companyName,
            }
        });
    } catch (e) {
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }
}
