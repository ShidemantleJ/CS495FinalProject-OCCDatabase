// Selects and exports the active data provider based on REACT_APP_DATA_PROVIDER.

import { supabaseAPI } from "./providers/supabase/supabaseAPI";
import { awsAPI } from "./providers/aws/awsAPI";

const providerName = (process.env.REACT_APP_DATA_PROVIDER || "supabase").toLowerCase();

const providers = {
  supabase: supabaseAPI,
  aws: awsAPI,
};

const selectedProviderName = providers[providerName] ? providerName : "supabase";
const selectedProvider = providers[selectedProviderName];

if (!providers[providerName]) {
  // eslint-disable-next-line no-console
  console.warn(`Unknown REACT_APP_DATA_PROVIDER "${providerName}", falling back to "supabase".`);
}

export const databaseAPI = selectedProvider;
export const databaseProvider = selectedProviderName;

