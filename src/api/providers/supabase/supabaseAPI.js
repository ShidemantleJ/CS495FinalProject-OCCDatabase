// Supabase API wrapper.
import { supabase } from "../../../supabaseClient";
import { applyFilters, applyOrderAndRange } from "./queryHelpers";

// Supabase API export
export const supabaseAPI = {
   // Auth functions
  getUser() {
    return supabase.auth.getUser();
  },
  getSession() {
    return supabase.auth.getSession();
  },
  onAuthStateChange(handler) {
    return supabase.auth.onAuthStateChange(handler);
  },
  signInWithPassword({ email, password }, options) {
    return supabase.auth.signInWithPassword({ email, password }, options);
  },
  setSession({ access_token, refresh_token }) {
    return supabase.auth.setSession({ access_token, refresh_token });
  },
  resetPasswordForEmail(email, { redirectTo } = {}) {
    return supabase.auth.resetPasswordForEmail(email, { redirectTo });
  },
  updatePassword(newPassword) {
    return supabase.auth.updateUser({ password: newPassword });
  },
  signOut() {
    return supabase.auth.signOut();
  },

  
  // Generalized table functions
  async create(tableName, payload, { select = "*" } = {}) {
    return supabase.from(tableName).insert([payload]).select(select).single();
  },
  async update(tableName, id, updates, { select = "*" } = {}) {
    return supabase.from(tableName).update(updates).eq("id", id).select(select).single();
  },
  async delete(tableName, id) {
    return supabase.from(tableName).delete().eq("id", id);
  },
    // Delete all rows matching a filter or filters
  async deleteAll(tableName, filter) {
    let query = supabase.from(tableName).delete();
    if (Array.isArray(filter)) {
      filter.forEach(f => {
        if (f.op === "eq") {
          query = query.eq(f.column, f.value);
        }
      });
    } else if (filter && typeof filter === "object") {
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    return query;
  },
  async get(tableName, id, { select = "*" } = {}) {
    return supabase.from(tableName).select(select).eq("id", id).single();
  },
  list(tableName, { select = "*", filters = [], orderBy, limit, range } = {}) {
    let query = supabase.from(tableName).select(select);
    query = applyFilters(query, filters);
    query = applyOrderAndRange(query, { orderBy, limit, range });
    return query;
  },

  // Storage functions
  createSignedUrl(bucket, path, expiresIn) {
    return supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  },
  uploadToStorage(bucket, path, file, options) {
    return supabase.storage.from(bucket).upload(path, file, options);
  },

  //specific functions
  async listNotesByAddedByMemberId(memberId, { includeChurch = true, tableName = "notes" } = {}) {
    // This call always fails ?
    
    // const baseSelect = includeChurch
    //   ? `
    //     *,
    //     church2!notes_church_id_fkey(church_name)
    //   `
    //   : "*";
    // const { data, error } = await supabase
    //   .from(tableName)
    //   .select(baseSelect)
    //   .eq("added_by_team_member_id", memberId)
    //   .order("created_at", { ascending: false });
    // if (!error) {
    //   return { data: data || [], error: null };
    // }
    // Fallback: no join, then hydrate church names if requested.
    const { data: notesData, error: notesError } = await supabase
      .from(tableName)
      .select("*")
      .eq("added_by_team_member_id", memberId)
      .order("created_at", { ascending: false });
    if (notesError || !includeChurch) {
      return { data: notesData || [], error: notesError };
    }
    const churchIds = [...new Set((notesData || []).map((n) => n.church_id).filter(Boolean))];
    if (churchIds.length === 0) {
      return { data: notesData || [], error: null };
    }
    const { data: churchesData, error: churchError } = await supabase
      .from("church2")
      .select("id, church_name")
      .in("id", churchIds);
    if (churchError) {
      return { data: notesData || [], error: null };
    }
    const churchesMap = {};
    (churchesData || []).forEach((c) => {
      churchesMap[c.id] = c;
    });
    const hydrated = (notesData || []).map((note) => ({
      ...note,
      church: churchesMap[note.church_id] || null,
    }));
    return { data: hydrated, error: null };
  },
  async listNotesByChurchId(churchId, { includeAddedBy = true, tableName = "notes" } = {}) {
    
    const { data: notesData, error: notesError } = await supabase
      .from(tableName)
      .select("*")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false });
    if (notesError || !includeAddedBy) {
      return { data: notesData || [], error: notesError };
    }
    const memberIds = [...new Set((notesData || []).map((n) => n.added_by_team_member_id).filter(Boolean))];
    if (memberIds.length === 0) {
      return { data: notesData || [], error: null };
    }
    const { data: membersData, error: membersError } = await supabase
      .from("team_members")
      .select("id, first_name, last_name")
      .in("id", memberIds);
    if (membersError) {
      return { data: notesData || [], error: null };
    }
    const membersMap = {};
    (membersData || []).forEach((m) => {
      membersMap[m.id] = m;
    });
    const hydrated = (notesData || []).map((note) => ({
      ...note,
      added_by: membersMap[note.added_by_team_member_id] || null,
    }));
    return { data: hydrated, error: null };
  },
};
