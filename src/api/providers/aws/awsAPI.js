// AWS API wrapper (not implemented).
import { notImplemented } from "./notImplemented";

// Single consolidated AWS API export
export const awsAPI = {
  // Auth functions
  getUser() {
    return notImplemented("awsAPI.getUser");
  },
  getSession() {
    return notImplemented("awsAPI.getSession");
  },
  onAuthStateChange(handler) {
    return notImplemented("awsAPI.onAuthStateChange");
  },
  signInWithPassword({ email, password }, options) {
    return notImplemented("awsAPI.signInWithPassword");
  },
  setSession({ access_token, refresh_token }) {
    return notImplemented("awsAPI.setSession");
  },
  resetPasswordForEmail(email, { redirectTo } = {}) {
    return notImplemented("awsAPI.resetPasswordForEmail");
  },
  updatePassword(newPassword) {
    return notImplemented("awsAPI.updatePassword");
  },
  signOut() {
    return notImplemented("awsAPI.signOut");
  },

  
  // Generalized table functions
  async create(tableName, payload, { select = "*" } = {}) {
    return notImplemented(`awsAPI.create(${tableName})`);
  },
  async update(tableName, id, updates, { select = "*" } = {}) {
    return notImplemented(`awsAPI.update(${tableName})`);
  },
  async remove(tableName, id) {
    return notImplemented(`awsAPI.remove(${tableName})`);
  },
  async get(tableName, id, { select = "*" } = {}) {
    return notImplemented(`awsAPI.get(${tableName})`);
  },
  list(tableName, { select = "*", filters = [], orderBy, limit, range } = {}) {
    return notImplemented(`awsAPI.list(${tableName})`);
  },

  // Storage functions
  createSignedUrl(bucket, path, expiresIn) {
    return notImplemented("awsAPI.createSignedUrl");
  },
  uploadToStorage(bucket, path, file, options) {
    return notImplemented("awsAPI.uploadToStorage");
  },

  //specific functions
  async listNotesByAddedByMemberId(memberId, { includeChurch = true, tableName = "notes" } = {}) {
    return notImplemented("awsAPI.listNotesByAddedByMemberId");
  },
};
