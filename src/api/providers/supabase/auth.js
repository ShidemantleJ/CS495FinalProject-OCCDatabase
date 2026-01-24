import { supabase } from "../../../supabaseClient";

export const auth = {
  getUser() {
    return supabase.auth.getUser();
  },
  getSession() {
    return supabase.auth.getSession();
  },
  onAuthStateChange(handler) {
    return supabase.auth.onAuthStateChange(handler);
  },
  signInWithPassword({ email, password }) {
    return supabase.auth.signInWithPassword({ email, password });
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
};
