import {PrivateLayout} from "@/components/Layout";

export default function layout({children}: {children: React.ReactNode}) {
  return <PrivateLayout>{children}</PrivateLayout>;
}
