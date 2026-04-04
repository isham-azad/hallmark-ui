import { getRewardsHistory } from "./actions";
import RewardsClient from "./RewardsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Rewards History | Admin Portal",
    description: "View all reward earnings and usages across the platform.",
};

export const dynamic = "force-dynamic";

export default async function RewardsHistoryPage() {
    const transactions = await getRewardsHistory();

    return <RewardsClient initialTransactions={transactions} />;
}
