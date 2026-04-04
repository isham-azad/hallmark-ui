import { getRedemptionRequests } from "../actions";
import RedemptionsClient from "./RedemptionsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Redemption Requests | Admin Portal",
    description: "Manage B2B reward point redemption requests.",
};

export const dynamic = "force-dynamic";

export default async function RedemptionsPage() {
    const requests = await getRedemptionRequests();

    return <RedemptionsClient initialRequests={requests} />;
}
