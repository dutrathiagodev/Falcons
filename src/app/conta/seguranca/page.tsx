import { createClient } from "@/lib/supabase/server";
import Security from "@/components/sections/security/security";

export default async function SecurityPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();

  return <Security enabled={(data?.totp ?? []).length > 0} />;
}
