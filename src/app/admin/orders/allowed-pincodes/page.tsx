import { getAllowedPincodes } from "../actions";
import AllowedPincodesClient from "./AllowedPincodesClient";

export const dynamic = "force-dynamic";

export default async function AllowedPincodesPage() {
    const initialPincodes = await getAllowedPincodes();

    return (
        <>
            <AllowedPincodesClient initialPincodes={initialPincodes} />
        </>
    );
}
