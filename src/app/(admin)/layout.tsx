import AdminLayout from "@/components/admin/AdminLayout";
import { AdminRoleProvider } from "@/context/AdminRoleContext";

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminRoleProvider>
            <AdminLayout>
                {children}
            </AdminLayout>
        </AdminRoleProvider>
    );
}
