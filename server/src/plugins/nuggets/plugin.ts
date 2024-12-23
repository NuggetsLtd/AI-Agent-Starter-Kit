import { Plugin } from "@ai16z/eliza";
import { VerifyAccountAction } from "./actions/verify-account.action.js";
import { NuggetsWalletVerificationProvider } from "./providers/nuggets-wallet-verification.provider.js";

export const nuggetsPlugin: Plugin = {
  name: "nuggets",
  description:
    "Generates and returns invite links for specific nuggets functionality, no data is needed from the user to initiate this out of band process",

  actions: [new VerifyAccountAction()],
  providers: [new NuggetsWalletVerificationProvider()],
};
