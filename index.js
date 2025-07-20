
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const { state, saveCreds } = await useMultiFileAuthState("auth");

const sock = makeWASocket({
  auth: state,
  printQRInTerminal: true
});

sock.ev.on("creds.update", saveCreds);

sock.ev.on("messages.upsert", async ({ messages }) => {
  const msg = messages[0];
  if (!msg.message) return;

  const from = msg.key.remoteJid;
  const messageType = Object.keys(msg.message)[0];
  const messageText = msg.message.conversation || msg.message[messageType]?.text;

  if (!messageText) return;

  if (messageText.toLowerCase() === "hi") {
    await sock.sendMessage(from, { text: "🔥 Hello! FIRE GOD MD Bot is online!" });
  }

  if (messageText.startsWith("@ai")) {
    const prompt = messageText.replace("@ai", "").trim();
    const response = await getOpenAIResponse(prompt);
    await sock.sendMessage(from, { text: response });
  }
});

async function getOpenAIResponse(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  const body = {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }]
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "❌ OpenAI error";
}
