import SocketProvider from "@/context/SocketProvider";
import {PrivateLayout} from "@/components/Layout";

export default function layout({children}: {children: React.ReactNode}) {
  return (
    <SocketProvider>
      <PrivateLayout>{children}</PrivateLayout>
    </SocketProvider>
  );
}
