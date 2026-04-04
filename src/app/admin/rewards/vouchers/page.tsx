import { getGiftVouchers } from "../actions";
import VouchersClient from "@/app/admin/rewards/vouchers/VouchersClient";

export const dynamic = "force-dynamic";

export default async function VouchersPage() {
    const vouchers = await getGiftVouchers();
    
    return <VouchersClient initialVouchers={vouchers} />;
}
