const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = Number.parseInt(process.env.PORT || "3001", 10);
const debugEnvEnabled = process.env.DEBUG_ENV === "1";

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/debug/env", (_req, res) => {
  if (!debugEnvEnabled) {
    return res.status(404).json({ error: "not_found" });
  }

  return res.json({
    hasWebhookUrl: Boolean(process.env.N8N_WEBHOOK_URL),
    hasToken: Boolean(process.env.N8N_TOKEN),
    port
  });
});

app.post("/deploy", async (req, res) => {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookToken = process.env.N8N_TOKEN;

  if (!webhookUrl) {
    return res.status(500).json({
      error: "server_config_error",
      message: "N8N_WEBHOOK_URL est manquant dans la configuration serveur."
    });
  }

  const template = typeof req.body?.template === "string" ? req.body.template.trim().toLowerCase() : "";
  const count = Number.parseInt(req.body?.count, 10);

  if (!template || !Number.isInteger(count) || count < 1) {
    return res.status(400).json({
      error: "invalid_payload",
      message: "Payload invalide: template requis, count doit être un entier >= 1."
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const headers = {
      "content-type": "application/json"
    };

    if (webhookToken) {
      headers["x-deploy-token"] = webhookToken;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ template, count }),
      signal: controller.signal
    });

    const rawText = await response.text();
    let parsedBody;

    try {
      parsedBody = rawText ? JSON.parse(rawText) : {};
    } catch {
      parsedBody = { raw: rawText };
    }

    if (!response.ok) {
      return res.status(502).json({
        error: "n8n_error",
        message: "Le webhook n8n a répondu avec une erreur.",
        upstreamStatus: response.status,
        upstreamBody: parsedBody
      });
    }

    return res.json(parsedBody);
  } catch (error) {
    if (error.name === "AbortError") {
      return res.status(500).json({
        error: "upstream_timeout",
        message: "Timeout: aucune réponse n8n après 15 secondes."
      });
    }

    return res.status(500).json({
      error: "internal_error",
      message: "Erreur interne pendant l'appel du webhook n8n."
    });
  } finally {
    clearTimeout(timeoutId);
  }
});

app.listen(port, () => {
  console.log(
    `[config] hasWebhookUrl=${Boolean(process.env.N8N_WEBHOOK_URL)} hasToken=${Boolean(process.env.N8N_TOKEN)} debugEnv=${debugEnvEnabled}`
  );
  console.log(`StackNest API listening on port ${port}`);
});
