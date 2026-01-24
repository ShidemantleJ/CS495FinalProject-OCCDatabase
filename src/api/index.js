import * as supabaseProvider from "./providers/supabase";
import * as awsProvider from "./providers/aws";

const providerName = (process.env.REACT_APP_DATA_PROVIDER || "supabase").toLowerCase();

const providers = {
  supabase: supabaseProvider,
  aws: awsProvider,
};

const selectedProviderName = providers[providerName] ? providerName : "supabase";
const selectedProvider = providers[selectedProviderName];

if (!providers[providerName]) {
  // eslint-disable-next-line no-console
  console.warn(`Unknown REACT_APP_DATA_PROVIDER "${providerName}", falling back to "supabase".`);
}

export const { churches, teamMembers, individuals, auth, storage, notes, positions, memberPositions } = selectedProvider;
export const dataProvider = selectedProviderName;
