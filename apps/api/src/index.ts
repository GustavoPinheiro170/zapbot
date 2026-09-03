import path from "node:path";
import { fileURLToPath } from "node:url";
import { MockAdapter } from "@whatsbot/whatsapp-adapter";
import { config as loadEnv } from "dotenv";
import { connectMongo } from "./db/mongo.js";
import { EchoAiResponder } from "./domain/aiResponder.js";
import { welcomeFlow } from "./domain/defaultFlow.js";
import { DEFAULT_USER_ID } from "./domain/defaultUser.js";
import { InMemoryConversationRepository } from "./repositories/conversationRepository.js";
import { MongoFlowRepository } from "./repositories/mongoFlowRepository.js";
import { InMemorySettingsRepository } from "./repositories/settingsRepository.js";
import { buildServer } from "./server.js";

// Resolved relative to this file (not process.cwd()) so `.env` loads correctly no matter
// where the process is launched from.
const packageDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
loadEnv({ path: path.join(packageDir, ".env") });

const port = Number(process.env.PORT ?? 3333);
const mongoUri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/whatsbot";

async function main() {
  let db;
  try {
    db = await connectMongo(mongoUri);
  } catch (error) {
    console.error(
      `[whatsbot-api] Não foi possível conectar ao MongoDB em "${mongoUri}".\n` +
        `Suba o banco com "docker compose up -d" na raiz do projeto e tente novamente.\n`,
      error,
    );
    process.exit(1);
  }

  const flowRepository = new MongoFlowRepository(db);
  await flowRepository.ensureIndexes();

  // First run: give a brand-new install a working flow to look at instead of an empty list.
  if (!(await flowRepository.get(DEFAULT_USER_ID, welcomeFlow.id))) {
    await flowRepository.save(DEFAULT_USER_ID, welcomeFlow);
  }

  const settingsRepository = new InMemorySettingsRepository({
    metaVerifyToken: process.env.META_VERIFY_TOKEN ?? "dev-verify-token",
    metaAccessToken: process.env.META_ACCESS_TOKEN || undefined,
    metaPhoneNumberId: process.env.META_PHONE_NUMBER_ID || undefined,
    // Settings (including this) live in memory and reset to this default on restart — the
    // painel's "Ativar" button changes it for the running process; ACTIVE_FLOW_ID in .env
    // changes what it resets back to.
    activeFlowId: process.env.ACTIVE_FLOW_ID || welcomeFlow.id,
  });

  if (!settingsRepository.isConnected()) {
    console.warn(
      "[whatsbot-api] Nenhuma credencial do WhatsApp configurada ainda — usando o MockAdapter em memória. " +
        "Conecte pelo painel (Configurações > Conectar WhatsApp) ou preencha apps/api/.env.",
    );
  }

  const app = buildServer({
    adapter: new MockAdapter(),
    aiResponder: new EchoAiResponder(),
    flowRepository,
    conversationRepository: new InMemoryConversationRepository(),
    settingsRepository,
    corsOrigin: process.env.WEB_ORIGIN || undefined,
  });

  await app.listen({ port, host: "0.0.0.0" });
  console.log(`[whatsbot-api] listening on http://localhost:${port}`);
  console.log(`[whatsbot-api] MongoDB conectado em ${mongoUri}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
