import {CssVarsProvider} from "@mui/joy";

export default function LoginLayout({children}: {children: React.ReactNode}) {
  return <CssVarsProvider>{children}</CssVarsProvider>;
}
