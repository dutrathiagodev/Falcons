import { createClient } from "@/lib/supabase/server";
import GamesClient from "@/components/sections/games/games";

export default async function GamesPage() {
  const supabase = await createClient();
  const { data: games } = await supabase
    .from("jogos")
    .select("*")
    .order("data", { ascending: false });

  return <GamesClient initialEvents={games || []} />;
}
