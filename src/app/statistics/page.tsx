import { createClient } from "@/lib/supabase/server";
import StatisticsClient from "@/components/sections/statistics/statistics";

export default async function StatisticsPage() {
  const supabase = await createClient();
  const [{ data: events }, { data: players }, { data: performance }] =
    await Promise.all([
      supabase.from("jogos").select("*").order("data", { ascending: false }),
      supabase.from("jogadores_leilao").select("*").order("nome"),
      supabase.from("estatisticas_individuais").select("*"),
    ]);

  return (
    <StatisticsClient
      initialEvents={events || []}
      players={players || []}
      initialPerformance={performance || []}
    />
  );
}
