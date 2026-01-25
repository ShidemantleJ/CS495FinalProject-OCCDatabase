// AWS auth provider placeholders (not implemented).

import { notImplemented } from "./notImplemented";

export const auth = {
  getUser() {
    return notImplemented("auth.getUser");
  },
  getSession() {
    return notImplemented("auth.getSession");
  },
  onAuthStateChange() {
    return notImplemented("auth.onAuthStateChange");
  },
  signInWithPassword() {
    return notImplemented("auth.signInWithPassword");
  },
  setSession() {
    return notImplemented("auth.setSession");
  },
  resetPasswordForEmail() {
    return notImplemented("auth.resetPasswordForEmail");
  },
  updatePassword() {
    return notImplemented("auth.updatePassword");
  },
  signOut() {
    return notImplemented("auth.signOut");
  },
};

