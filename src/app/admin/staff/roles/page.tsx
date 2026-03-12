import { getRoles } from "./actions";
import { getPermissions } from "../permissions/actions";
import RolesClient from "./RolesClient";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
    const roles = await getRoles();
    const permissions = await getPermissions();
    return <RolesClient initialRoles={roles} allPermissions={permissions} />;
}
