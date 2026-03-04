// portal/app/portal/admin/page.tsx
import { redirect } from "next/navigation";
export default function AdminPage() {
  redirect("/portal/admin/users");
}