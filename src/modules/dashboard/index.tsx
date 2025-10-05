import DashboardRooms from "./DashboardRooms";
import AuthGuard from "@/components/auth/authGuard";

export default function Index() {
  return (
    <AuthGuard>
      <DashboardRooms />
    </AuthGuard>
  );
}
