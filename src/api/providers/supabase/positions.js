import { supabase } from "../../../supabaseClient";

const TABLE = "positions";

export const positions = {
  listAll() {
    return supabase.from(TABLE).select("*").order("code", { ascending: true });
  },
};
