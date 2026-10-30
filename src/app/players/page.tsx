import { createClient } from "@/lib/supabase/server";
import PlayersClient from "@/components/sections/players/players";

export default async function PlayersPage() {
  const supabase = await createClient();
  const [{ data: players }, { data: performance }] = await Promise.all([
    supabase.from("jogadores_leilao").select("*").order("nome"),
    supabase.from("estatisticas_individuais").select("*"),
  ]);

  return (
    <PlayersClient
      initialPlayers={players || []}
      initialPerformance={performance || []}
    />
  );
}
