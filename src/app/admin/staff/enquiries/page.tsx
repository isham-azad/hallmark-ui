import { getEnquiries } from "./actions";
import EnquiryListClient from "./EnquiryListClient";

export const dynamic = "force-dynamic";

export default async function EnquiriesPage() {
    const enquiries = await getEnquiries();

    return <EnquiryListClient initialEnquiries={enquiries} />;
}
