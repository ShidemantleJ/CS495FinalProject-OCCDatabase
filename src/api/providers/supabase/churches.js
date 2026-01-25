// Supabase churches table queries and mutations.

import { supabase } from "../../../supabaseClient";
import { applyFilters, applyOrderAndRange } from "./queryHelpers";

const TABLE = "church2";

export const churches = {
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
  /*
    This is likely causing the issue with updating every church with the same name. Should be removed and only use the above update function
  */
  async updateByField(field, value, updates, { select = "*" } = {}) { 
    return supabase.from(TABLE).update(updates).eq(field, value).select(select);
  },
  async remove(id) {
    return supabase.from(TABLE).delete().eq("id", id);
  },
};

