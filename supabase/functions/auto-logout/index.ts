// This is an edge function that will be called every 30mins by a cron job. It scans through the 'users' table and deletes sessions for users who have been inactive for more than
// a pre-determined time (15mins). Because this runs every 15 minutes, a user that has left the website for 15-30mins will be automatically logged out and required to log back in.

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req) => {
  // Supabase service role credentials (stored in environment variables)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const logoutThresholdMs = 15 * 60 * 1000 // logout threshold. If user has been inactive for longer than this time (in ms), they will be logged out.
    const logoutCutoffTime = new Date(Date.now() - logoutThresholdMs).toISOString();

    // Get IDs of all users who have been inactive for longer than the logout threshold
    const { data: inactiveUsers, error: userError } = await supabase
      .from("users")
      .select("id")
      .lt("last_activity", logoutCutoffTime);

    if (userError) throw userError;

    if (!inactiveUsers || inactiveUsers.length === 0) {
      return new Response(JSON.stringify({ message: "No inactive users found." }), {
        status: 200,
      });
    }

    const userIds = inactiveUsers.map((u) => u.id);

    // Delete sessions for all inactive users
    const { data: deletedSessions, error: sessionError } = await supabase
      .from("auth.sessions")
      .delete()
      .in("user_id", userIds);

    if (sessionError) throw sessionError;

    return new Response(
      JSON.stringify({
        message: `Logged out ${deletedSessions?.length || 0} inactive users.`,
        users: userIds,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error logging out inactive users:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
    });
  }
});
