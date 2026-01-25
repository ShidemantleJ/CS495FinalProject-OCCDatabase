// Supabase member_positions queries and updates.

import { supabase } from "../../../supabaseClient";

const TABLE = "member_positions";

export const memberPositions = {
  listActiveByMemberId(memberId) {
    return supabase
      .from(TABLE)
      .select("position")
      .eq("member_id", memberId)
      .is("end_date", null);
  },
  listByMemberId(memberId) {
    return supabase.from(TABLE).select("*").eq("member_id", memberId);
  },
  listByPositions(positions) {
    return supabase.from(TABLE).select("member_id, position").in("position", positions);
  },
  listByMemberIds(memberIds) {
    return supabase.from(TABLE).select("member_id, position").in("member_id", memberIds);
  },
  endActiveByMemberId(memberId, endDate) {
    return supabase.from(TABLE).update({ end_date: endDate }).eq("member_id", memberId).is("end_date", null);
  },
  insertMany(rows) {
    return supabase.from(TABLE).insert(rows);
  },
};

