import PrivateLayout from "../../components/Layout/PrivateLayout";

export default function layout({ children }: { children: React.ReactNode }) {
  return <PrivateLayout>{children}</PrivateLayout>;
}
