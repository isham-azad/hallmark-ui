import B2BLoginClient from "./B2BLoginClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "B2B Portal Login | HallMark",
    description: "Login for HallMark B2B Clients",
};

export default function B2BLoginPage() {
    return <B2BLoginClient />;
}
