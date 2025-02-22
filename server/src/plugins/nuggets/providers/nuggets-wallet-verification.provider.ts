import { AnyType } from "../../../utils.js";
import { Provider } from "@ai16z/eliza";
import axios, { AxiosInstance } from "axios";
import { generateRedirectUri } from "../oidc-provider.js";

export class NuggetsWalletVerificationProvider implements Provider {
  protected client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: "http://localhost:3016/api/",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 5 * 60 * 1000,
    });
  }

  async get(): Promise<AnyType> {
    console.log(
      "[NuggetsWalletVerificationProvider]: Generating Nuggets Invite..."
    );
    const redirectUri = await generateRedirectUri();
    console.log(
      "[NuggetsWalletVerificationProvider]: Nuggets Invite generated"
    );

    return `Invite link: <a href="${redirectUri}" alt="Verification invite link" class="nuggets-deeplink" target="_blank">Verification invite link</a>`;
  }
}
