import { generateMessageResponse } from "@ai16z/eliza";
import {
  Content,
  IAgentRuntime,
  Memory,
  ModelClass,
  State,
  UUID,
} from "@ai16z/eliza";
import {
  AgentRuntime,
  Character,
  defaultCharacter,
  ModelProviderName,
  MemoryManager,
  CacheManager,
  MemoryCacheAdapter,
} from "@ai16z/eliza";
import { stringToUuid } from "@ai16z/eliza";
// import { composeContext } from "@ai16z/eliza";
import { getEmbeddingZeroVector } from "@ai16z/eliza";
import { messageCompletionFooter } from "@ai16z/eliza";
import { composeContext, elizaLogger } from "@ai16z/eliza";
import path from "path";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { NuggetsChatContext } from "../types/nuggets.js";
// import { bootstrapPlugin } from "@ai16z/plugin-bootstrap";
import plugins from "../plugins/index.js";

elizaLogger.closeByNewLine = false;
elizaLogger.verbose = true;

import { SqliteDatabaseAdapter } from "@ai16z/adapter-sqlite";
import Database from "better-sqlite3";

const { nuggetsPlugin } = plugins;
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const webMessageHandlerTemplate =
  // {{goals}}
  `# Action Examples
{{actionExamples}}
(Action examples are for reference only. Do not use the information from them in your response.)

# Knowledge
{{knowledge}}

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

Examples of {{agentName}}'s dialog and actions:
{{characterMessageExamples}}

{{providers}}

{{attachments}}

{{actions}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

{{messageDirections}}

{{recentMessages}}

# Task: Generate a post/reply in the voice, style and perspective of {{agentName}} (@{{twitterUserName}}) while using the thread of tweets as additional context:
Current Post:
{{currentPost}}
Thread of Tweets You Are Replying To:

{{formattedConversation}}
` + messageCompletionFooter;

export class ElizaBot {
  private runtime: IAgentRuntime;

  constructor() {
    this.runtime = ElizaService.getInstance().getRuntime();
  }

  public async respond(
    ctx: NuggetsChatContext
  ): Promise<Content | string | null> {
    if (!ctx.message || !ctx.from) {
      return null; // Exit if no message or sender info
    }

    const userId = stringToUuid(ctx.from.id.toString()) as UUID;
    const message = ctx.message;
    const agentId = this.runtime.agentId;
    const chatId = stringToUuid(
      ctx.chat?.id.toString() + "-" + this.runtime.agentId
    ) as UUID;
    const roomId = chatId;
    const messageId = stringToUuid(
      message.message_id.toString() + "-" + this.runtime.agentId
    ) as UUID;

    if (!message.text) {
      return null; // Skip if no content
    }

    const content: Content = {
      text: message.text,
      source: "web",
    };

    // Create memory for the message
    const memory: Memory = {
      id: messageId,
      agentId,
      userId,
      roomId,
      content,
      createdAt: message.date * 1000,
      embedding: getEmbeddingZeroVector(),
    };

    let state = await this.runtime.composeState(memory);
    state = await this.runtime.updateRecentMessageState(state);
    // console.log({
    //   character: this.runtime.character,
    // });
    const context = composeContext({
      state,
      template:
        this.runtime.character?.templates?.messageHandlerTemplate ||
        webMessageHandlerTemplate,
    });

    const responseContent = await this._generateResponse(
      memory,
      state,
      context
    );

    return responseContent?.text || responseContent;
  }

  // Generate a response using AI
  private async _generateResponse(
    message: Memory,
    _state: State,
    context: string
  ): Promise<Content | null> {
    const { userId, roomId } = message;
    console.log(
      "[_generateResponse] check1",
      this.runtime,
      this.runtime.plugins[1]
    );
    const response = await generateMessageResponse({
      runtime: this.runtime,
      context,
      modelClass: ModelClass.SMALL,
    });
    console.log("[_generateResponse] check2");
    if (!response) {
      console.error("❌ No response from generateMessageResponse");
      return null;
    }
    console.log("[_generateResponse] check3");
    await this.runtime.databaseAdapter.log({
      body: { message, context, response },
      userId: userId,
      roomId,
      type: "response",
    });
    console.log("[_generateResponse] check4");
    return response;
  }
}

export class ElizaService {
  private static instance: ElizaService;
  private runtime: AgentRuntime;

  private constructor() {
    // Load character from json file
    let character: Character;

    if (!process.env.ELIZA_CHARACTER_PATH) {
      console.log("No ELIZA_CHARACTER_PATH defined, using default character");
      character = defaultCharacter;
    } else {
      try {
        // Use absolute path from project root
        const fullPath = resolve(
          __dirname,
          "../../..",
          process.env.ELIZA_CHARACTER_PATH
        );
        console.log(`Loading character from: ${fullPath}`);

        if (!existsSync(fullPath)) {
          throw new Error(`Character file not found at ${fullPath}`);
        }

        const fileContent = readFileSync(fullPath, "utf-8");
        character = JSON.parse(fileContent);
        console.log("Successfully loaded custom character:", character.name);
      } catch (error) {
        console.error(
          `Failed to load character from ${process.env.ELIZA_CHARACTER_PATH}:`,
          error
        );
        console.log("Falling back to default character");
        character = defaultCharacter;
      }
    }

    // character.modelProvider = ModelProviderName.GAIANET // FIX: Commented out since model provider is best set from character.json

    const sqlitePath = path.join(__dirname, "..", "..", "..", "eliza.sqlite");
    console.log("Using SQLite database at:", sqlitePath);
    // Initialize SQLite adapter
    const db = new SqliteDatabaseAdapter(new Database(sqlitePath));

    db.init()
      .then(() => {
        console.log("Database initialized.");
      })
      .catch((error) => {
        console.error("Failed to initialize database:", error);
        throw error;
      });

    try {
      this.runtime = new AgentRuntime({
        databaseAdapter: db,
        token: process.env.OPENAI_API_KEY || "",
        modelProvider: character.modelProvider || ModelProviderName.GAIANET,
        character,
        conversationLength: 4096,
        plugins: [nuggetsPlugin],
        cacheManager: new CacheManager(new MemoryCacheAdapter()),
        logging: true,
      });
      // Create memory manager
      const onNuggetsMemory = new MemoryManager({
        tableName: "onnuggets",
        runtime: this.runtime,
      });
      this.runtime.registerMemoryManager(onNuggetsMemory);
    } catch (error) {
      console.error("Failed to initialize Eliza runtime:", error);
      throw error;
    }
  }

  public static getInstance(): ElizaService {
    if (!ElizaService.instance) {
      ElizaService.instance = new ElizaService();
    }
    return ElizaService.instance;
  }

  public getRuntime(): AgentRuntime {
    return this.runtime;
  }
}
