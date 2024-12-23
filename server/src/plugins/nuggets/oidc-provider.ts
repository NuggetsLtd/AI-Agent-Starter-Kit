import * as client from "openid-client";

const oidcProviderUrl =
  process.env.OAUTH_PROVIDER_URL || "https://auth-dev.internal-nuggets.life";
const nuggetsClientId = process.env.NUGGETS_CLIENT_ID || "";
const nuggetsPrivateKey = process.env.NUGGETS_PRIVATE_KEY || "";
let config: client.Configuration;

async function _initOidcClientConfig() {
  if (config) {
    return;
  }

  const server: URL = new URL(oidcProviderUrl); // Authorization Server's Issuer Identifier
  const clientId: string = nuggetsClientId; // Client identifier at the Authorization Server
  const clientSecret: string = nuggetsPrivateKey; // Client Secret

  config = await client.discovery(server, clientId, clientSecret);
}

export async function generateRedirectUri() {
  await _initOidcClientConfig();

  /**
   * Value used in the authorization request as the redirect_uri parameter, this
   * is typically pre-registered at the Authorization Server.
   */
  const redirect_uri: string = "http://localhost:3001/auth";
  const scope: string = "openid"; // Scope of the access request
  /**
   * PKCE: The following MUST be generated for every redirect to the
   * authorization_endpoint. You must store the code_verifier and state in the
   * end-user session such that it can be recovered as the user gets redirected
   * from the authorization server back to your application.
   */
  const code_verifier: string = client.randomPKCECodeVerifier();
  const code_challenge: string =
    await client.calculatePKCECodeChallenge(code_verifier);
  const nonce = client.randomNonce();
  let state!: string;

  const parameters: Record<string, string> = {
    redirect_uri,
    scope,
    response_type: "code",
    response_mode: "jwt",
    state: "state",
    nonce,
    code_challenge,
    code_challenge_method: "S256",
  };

  if (!config.serverMetadata().supportsPKCE()) {
    /**
     * We cannot be sure the server supports PKCE so we're going to use state too.
     * Use of PKCE is backwards compatible even if the AS doesn't support it which
     * is why we're using it regardless. Like PKCE, random state must be generated
     * for every redirect to the authorization_endpoint.
     */
    state = client.randomState();
    parameters.state = state;
  }

  const redirectTo: URL = client.buildAuthorizationUrl(config, parameters);

  return redirectTo.href;
}
