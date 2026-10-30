import { createClient } from "@/lib/supabase/server";
import { PLAYER_COLUMNS } from "@/lib/volleyball";
import Dashboard from "@/components/sections/dashboard/dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ data: players }, { data: events }, { data: performance }] = await Promise.all([
    supabase.from("jogadores_leilao").select(PLAYER_COLUMNS).order("nome"),
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
