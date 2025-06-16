import { ReactNode } from "react";
import CustomerManagerShell from "./CustomerManagerShell";

export default function CustomerManagerLayout({ children }: { children: ReactNode }) {
  return <CustomerManagerShell>{children}</CustomerManagerShell>;
} 