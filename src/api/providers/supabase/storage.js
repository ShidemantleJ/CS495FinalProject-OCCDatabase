// Supabase storage helpers for signed URLs and uploads.

import { supabase } from "../../../supabaseClient";

export const storage = {
  createSignedUrl(bucket, path, expiresIn) {
    return supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  },
  upload(bucket, path, file, options) {
    return supabase.storage.from(bucket).upload(path, file, options);
  },
};

