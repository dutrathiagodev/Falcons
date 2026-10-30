import { createClient } from "@/lib/supabase/server";
import Dashboard from "@/components/sections/dashboard/dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ data: players }, { data: events }, { data: performance }] = await Promise.all([
    supabase.from("jogadores_leilao").select("*").order("nome"),
    supabase.from("jogos").select("*").order("data", { ascending: false }),
    supabase.from("estatisticas_individuais").select("*"),
  ]);

  return (
    <Dashboard
      players={players || []}
      events={events || []}
      performance={performance || []}
    />
  );
}
