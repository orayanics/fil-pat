import SocketProvider from "@/context/SocketProvider";
import DashboardRooms from "./DashboardRooms";
export default function Index() {
  return (
    <SocketProvider>
      <DashboardRooms />
    </SocketProvider>
  );
}
