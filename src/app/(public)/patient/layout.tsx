import {PatientProvider} from "@/context/PatientProvider";
export default function layout({children}: {children: React.ReactNode}) {
  return <PatientProvider>{children}</PatientProvider>;
}
