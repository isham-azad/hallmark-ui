import { getStaff } from "./actions";
import { getRoles } from "./roles/actions";
import StaffClient from "./StaffClient";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
    const [staff, roles] = await Promise.all([getStaff(), getRoles()]);
    return <StaffClient initialStaff={staff} availableRoles={roles} />;
}
