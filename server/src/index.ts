import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { IService } from "./services/base.service.js";
import elizaRouter from "./routes/eliza.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const services: IService[] = [];

dotenv.config({
  path: resolve(__dirname, "../../.env"),
});

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());

app.use(express.json());
app.use("/eliza", elizaRouter);

app.listen(port, async () => {
  console.log(`Server running on PORT: ${port}`);
  console.log("Server Environment:", process.env.NODE_ENV);
});

// catch-all routes
app.use("/", async (_req, res) => {
  console.log("Getting hello world...");
  res
    .status(200)
    .json({ message: "Hello World", timestamp: new Date().toISOString() });
});

async function gracefulShutdown() {
  console.log("Shutting down gracefully...");
  await Promise.all(services.map((service) => service.stop()));
  process.exit(0);
}

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
