import Anthropic from '@anthropic-ai/sdk';
import { oidcFederationProvider } from '@anthropic-ai/sdk/lib/credentials/oidc-federation';
import { getVercelOidcToken } from '@vercel/oidc';

/**
 * How the server authenticates to the Anthropic API, in priority order:
 *  1. `api-key`: ANTHROPIC_API_KEY is set.
 *  2. `federation-env`: workload identity federation with an identity token you supply
 *     (ANTHROPIC_IDENTITY_TOKEN_FILE or ANTHROPIC_IDENTITY_TOKEN). The SDK picks this up itself.
 *  3. `federation-vercel`: workload identity federation using Vercel's OIDC token for the
 *     deployment, so no long-lived secret is stored anywhere.
 * Federation needs ANTHROPIC_FEDERATION_RULE_ID and ANTHROPIC_ORGANIZATION_ID (plus
 * ANTHROPIC_SERVICE_ACCOUNT_ID, and ANTHROPIC_WORKSPACE_ID if the rule spans several workspaces).
 */
export type AuthMode = 'api-key' | 'federation-env' | 'federation-vercel' | 'none';

export function authMode(env: NodeJS.ProcessEnv = process.env): AuthMode {
  if (env.ANTHROPIC_API_KEY) return 'api-key';
  if (!env.ANTHROPIC_FEDERATION_RULE_ID || !env.ANTHROPIC_ORGANIZATION_ID) return 'none';
  if (env.ANTHROPIC_IDENTITY_TOKEN_FILE || env.ANTHROPIC_IDENTITY_TOKEN) return 'federation-env';
  return 'federation-vercel';
}

export function createClient(env: NodeJS.ProcessEnv = process.env): Anthropic {
  switch (authMode(env)) {
    case 'federation-vercel':
      // The client caches the exchanged access token and refreshes it before it expires.
      return new Anthropic({
        credentials: oidcFederationProvider({
          identityTokenProvider: () => getVercelOidcToken(),
          federationRuleId: env.ANTHROPIC_FEDERATION_RULE_ID as string,
          organizationId: env.ANTHROPIC_ORGANIZATION_ID as string,
          serviceAccountId: env.ANTHROPIC_SERVICE_ACCOUNT_ID || undefined,
          workspaceId: env.ANTHROPIC_WORKSPACE_ID || undefined,
          baseURL: env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
          fetch: (...args) => globalThis.fetch(...args),
        }),
      });
    default:
      // API key, or federation configured through the SDK's own environment variables.
      return new Anthropic();
  }
}

let shared: Anthropic | undefined;
/** One client per server instance, so the cached federation token is reused between requests. */
export const getClient = () => (shared ??= createClient());
