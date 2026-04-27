import cors from "cors";
import "dotenv/config";
import express from "express";

const app = express();
const port = process.env.PORT || 3000;
const frontendOrigins = (process.env.FRONTEND_ORIGIN || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const aiServerUrl =
  process.env.HUGGINGFACE_SPACE_URL ||
  process.env.LLAMA_SERVER_URL ||
  "http://127.0.0.1:8080";
const llamaModel = process.env.LLAMA_MODEL || "manhir";

app.use(
  cors({
    origin(origin, callback) {
      if (frontendOrigins.includes("*") || !origin || frontendOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origem nao permitida pelo CORS: ${origin}`));
    },
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (_request, response) => {
  response.json({
    name: "Manhir Backend",
    status: "online",
    routes: ["/health", "/chat"],
  });
});

app.get("/health", (_request, response) => {
  response.json({
    ok: true,
    aiServerUrl,
  });
});

app.post("/chat", async (request, response) => {
  const { message, messages = [] } = request.body || {};

  if (!message || typeof message !== "string") {
    return response.status(400).json({
      error: "Envie um campo 'message' com texto.",
    });
  }

  const conversation = [
    {
      role: "system",
      content:
        "Voce e o Manhir, um assistente especialista em desenvolvimento web frontend. Seu foco principal e JavaScript, HTML e CSS. Ajude o usuario a criar, corrigir, explicar e melhorar codigo frontend. Responda em portugues do Brasil quando o usuario falar portugues. Seja direto, pratico e mostre exemplos de codigo quando isso ajudar. Quando o usuario mandar um erro, explique a causa provavel e de passos claros para corrigir. Se o usuario pedir algo fora de frontend, ainda ajude, mas mantenha prioridade em solucoes simples e bem explicadas.",
    },
    ...normalizeMessages(messages),
  ];

  if (conversation.at(-1)?.content !== message) {
    conversation.push({ role: "user", content: message });
  }

  try {
    const llamaResponse = await fetch(`${aiServerUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: llamaModel,
        messages: conversation,
        temperature: 0.7,
        max_tokens: 700,
      }),
    });

    if (!llamaResponse.ok) {
      const details = await llamaResponse.text();
      return response.status(502).json({
        error: "Hugging Face Space respondeu com erro.",
        details,
      });
    }

    const data = await llamaResponse.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    return response.json({
      reply: reply || "O modelo respondeu vazio.",
    });
  } catch (error) {
    return response.status(502).json({
      error: "Nao consegui conectar ao Hugging Face Space.",
      details: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Manhir backend rodando na porta ${port}`);
});

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((item) => {
      return (
        item &&
        ["user", "assistant", "system"].includes(item.role) &&
        typeof item.content === "string" &&
        item.content.trim()
      );
    })
    .map((item) => ({
      role: item.role,
      content: item.content.trim(),
    }))
    .slice(-12);
}
