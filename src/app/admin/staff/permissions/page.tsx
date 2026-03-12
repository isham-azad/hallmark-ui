import { getPermissions } from "./actions";
import PermissionsClient from "./PermissionsClient";

export const dynamic = "force-dynamic";

export default async function PermissionsPage() {
    const permissions = await getPermissions();
    return <PermissionsClient initialPermissions={permissions} />;
}
