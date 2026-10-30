import { Suspense } from "react";
import Login from "@/components/sections/login/login";

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
