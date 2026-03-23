import { NextResponse } from "next/server";
import { deleteB2BSession } from "@/lib/b2b-auth";

export async function POST() {
    try {
        await deleteB2BSession();
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
