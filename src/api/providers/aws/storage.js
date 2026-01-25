// AWS storage provider placeholders (not implemented).

import { notImplemented } from "./notImplemented";

export const storage = {
  createSignedUrl() {
    return notImplemented("storage.createSignedUrl");
  },
  upload() {
    return notImplemented("storage.upload");
  },
};

