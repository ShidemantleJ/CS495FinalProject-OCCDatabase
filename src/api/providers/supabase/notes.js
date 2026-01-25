// Supabase notes queries with joins and fallback hydration.

import { supabase } from "../../../supabaseClient";

const TABLE = "notes";

export const notes = {
  listByChurchId(churchId) {
    return supabase
      .from(TABLE)
      .select(
        `
        *,
        team_members!added_by_team_member_id(first_name, last_name)
      `
      )
      .eq("church_id", churchId)
      .order("created_at", { ascending: false });
  },
  async listByAddedByMemberId(memberId, { includeChurch = true } = {}) {
    const baseSelect = includeChurch
      ? `
        *,
        church2!notes_church_fkey(church_name)
      `
      : "*";

    const { data, error } = await supabase
      .from(TABLE)
      .select(baseSelect)
      .eq("added_by_team_member_id", memberId)
      .order("created_at", { ascending: false });

    if (!error) {
      return { data: data || [], error: null };
    }

    // Fallback: no join, then hydrate church names if requested.
    const { data: notesData, error: notesError } = await supabase
      .from(TABLE)
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
  create(payload) {
    return supabase.from(TABLE).insert(payload);
  },
  update(id, updates) {
    return supabase.from(TABLE).update(updates).eq("id", id).select();
  },
  remove(id) {
    return supabase.from(TABLE).delete().eq("id", id).select();
  },
};

