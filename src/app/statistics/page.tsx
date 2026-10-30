import { createClient } from "@/lib/supabase/server";
import { withSignedPhotos } from "@/lib/photos";
import { PLAYER_COLUMNS } from "@/lib/volleyball";
import StatisticsClient from "@/components/sections/statistics/statistics";

export default async function StatisticsPage() {
  const supabase = await createClient();
  const [{ data: events }, { data: players }, { data: performance }] =
    await Promise.all([
      supabase.from("jogos").select("*").order("data", { ascending: false }),
      supabase.from("jogadores_leilao").select(PLAYER_COLUMNS).order("nome"),
      supabase.from("estatisticas_individuais").select("*"),
    ]);

  return (
    <StatisticsClient
      initialEvents={events || []}
      players={await withSignedPhotos(supabase, players || [])}
      initialPerformance={performance || []}
    />
  );
}
