import {
  ActionExample,
  Handler,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  State,
  Validator,
  // Memory,
  // getEmbeddingZeroVector,
} from "@ai16z/eliza";
import { NuggetsBaseAction } from "./nuggets.action.js";
import { generateRedirectUri } from "../oidc-provider.js";
// import { randomUUID } from "crypto";
// import { chainMap } from "../../../utils.js";

// interface BotAccountResponse {
//   success: boolean;
//   deeplink: string;
//   qrCode: string;
//   ref: string;
// }

export class VerifyAccountAction extends NuggetsBaseAction {
  constructor() {
    const name = "VERIFY_SMART_ACCOUNT";
    const similes = [
      "VERIFY_ACCOUNT",
      "VERIFY_ETHEREUM_ACCOUNT",
      "VERIFY_WALLET",
      "VERIFY_WALLET_ADDRESS",
      "VERIFY_EVM_WALLET",
      "VERIFY_SMART_WALLET",
      "CONNECT_WALLET",
      "LINK_WALLET",
    ];
    const description =
      "Generates an invite link to start verification of a user's account; for this, no data is needed from the user to start the process";
    const handler: Handler = async (
      _runtime,
      _message,
      _state,
      _options?: { [key: string]: unknown },
      _callback?: HandlerCallback
    ): Promise<boolean> => {
      console.log("[VerifyAccountAction]: verify user account");

      try {
        console.log("[VerifyAccountAction]: Generating Nuggets Invite...");
        // const response = await this.client.post<BotAccountResponse>(
        //   `/didcomm/invite`,
        //   {
        //     onUserConnect:
        //       "https://schemas.nuggets.life/cryptoAccountVc/1.0/verify/1_start", // verify crypto account vc
        //   },
        //   {
        //     headers: {
        //       "Content-Type": "application/json",
        //     },
        //   }
        // );
        const redirectUri = await generateRedirectUri();
        console.log("[VerifyAccountAction]: Nuggets Invite generated");

        _callback?.({
          text: `Invite link: <a href="${redirectUri}" alt="Verification invite link" class="nuggets-deeplink" target="_blank">Verification invite link</a>`,
          action: redirectUri,
        });

        return true;
      } catch (error) {
        this.handleError(error);
        return false;
      }
    };
    const validate: Validator = async (
      _runtime: IAgentRuntime,
      message: Memory,
      state: State | undefined
    ): Promise<boolean> => {
      // console.log("[VerifyAccountAction] Validation called with:", {
      //   message,
      //   state,
      // });
      console.log(
        "[VerifyAccountAction] Current selected action:",
        state?.selectedAction
      );

      const userText = message.content.text.toLowerCase();
      const verificationKeywords = ["verify", "wallet", "account", "connect"];
      return verificationKeywords.some((keyword) => userText.includes(keyword));
    };
    const examples: ActionExample[][] = [
      [
        {
          user: "{{user1}}",
          content: {
            text: "I want to verify my wallet",
          },
        },
        {
          user: "{{agentName}}",
          content: {
            text: "I'll help you verify your wallet.",
            action: "VERIFY_SMART_ACCOUNT",
          },
        },
      ],
      [
        {
          user: "{{user1}}",
          content: {
            text: "I want to verify my account",
          },
        },
        {
          user: "{{agentName}}",
          content: {
            text: "I'll help you verify your account.",
            action: "VERIFY_SMART_ACCOUNT",
          },
        },
      ],
      [
        {
          user: "{{user1}}",
          content: {
            text: "How do I connect my wallet?",
          },
        },
        {
          user: "{{agentName}}",
          content: {
            text: "I can help you connect and verify your wallet.",
            action: "VERIFY_SMART_ACCOUNT",
          },
        },
      ],
      [
        {
          user: "{{user1}}",
          content: {
            text: "Verify my account please",
          },
        },
        {
          user: "{{agentName}}",
          content: {
            text: "I'll help you verify your account.",
            action: "VERIFY_SMART_ACCOUNT",
          },
        },
      ],
    ];
    super(name, description, similes, examples, handler, validate);
  }
}
