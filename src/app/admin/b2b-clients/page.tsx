import { getB2BClients } from "./actions";
import B2BClientsClient from "./B2BClientsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "B2B Clients | Admin Panel",
    description: "Manage B2B Clients for the platform.",
};

export const dynamic = "force-dynamic";

export default async function B2BClientsPage() {
    const clients = await getB2BClients();

    return <B2BClientsClient initialClients={clients} />;
}
