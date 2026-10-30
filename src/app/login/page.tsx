import Login from "@/components/sections/login/login";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ etapa?: string }>;
}) {
  // Reading the step on the server keeps the form in the initial HTML (no blank flash).
  const { etapa } = await searchParams;
  return <Login initialStep={etapa === "codigo" ? "code" : "password"} />;
}
