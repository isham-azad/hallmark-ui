import { Metadata } from "next";
import B2BAccountClient from "./B2BAccountClient";

export const metadata: Metadata = {
    title: "My B2B Account | HallMark",
    description: "Manage your HallMark B2B account",
};

export default function B2BAccountPage() {
    return <B2BAccountClient />;
}
