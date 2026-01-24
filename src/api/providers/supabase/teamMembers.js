import { supabase } from "../../../supabaseClient";
import { applyFilters, applyOrderAndRange } from "./queryHelpers";

const TABLE = "team_members";

export const teamMembers = {
  list({ select = "*", filters = [], orderBy, limit, range } = {}) {
    let query = supabase.from(TABLE).select(select);
    query = applyFilters(query, filters);
    query = applyOrderAndRange(query, { orderBy, limit, range });
    return query;
  },
  async getById(id, { select = "*" } = {}) {
    return supabase.from(TABLE).select(select).eq("id", id).single();
  },
  async create(payload, { select = "*" } = {}) {
    return supabase.from(TABLE).insert([payload]).select(select).single();
  },
  async update(id, updates, { select = "*" } = {}) {
    return supabase.from(TABLE).update(updates).eq("id", id).select(select).single();
  },
  async remove(id) {
    return supabase.from(TABLE).delete().eq("id", id);
  },
};
