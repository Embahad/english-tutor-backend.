import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MEMORY_FILE = "./memory.json";

// 🧠 Load memory
function loadMemory() {
  if (!fs.existsSync(MEMORY_FILE)) return {};
  return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
}

// 🧠 Save memory
function saveMemory(data) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
}

app.post("/chat", async (req, res) => {
  try {
    const userText = req.body.text;

    let memory = loadMemory();

    // default user memory
    if (!memory.user) {
      memory.user = {
        name: "friend",
        mistakes: []
      };
    }

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `
You are Giulia, a friendly English tutor with permanent memory.

USER MEMORY:
- Name: ${memory.user.name}
- Known mistakes: ${JSON.stringify(memory.user.mistakes)}

RULES:
1. Always correct English first
2. Be friendly, human, and conversational
3. Remember user information when relevant
4. Keep replies short (1–3 lines)
5. If user gives name, store it naturally in response

IMPORTANT:
- You are NOT a chatbot
- You are Giulia, a consistent personality with memory
`
        },
        { role: "user", content: userText },
      ],
    });

    let reply = response.choices[0].message.content;

    // 🧠 SIMPLE MEMORY DETECTION (name capture)
    if (userText.toLowerCase().includes("my name is")) {
      const name = userText.split("is")[1]?.trim();
      if (name) {
        memory.user.name = name;
        saveMemory(memory);
      }
    }

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.json({ reply: "Error processing request 😅" });
  }
});

app.get("/", (req, res) => {
  res.send("Giulia is alive with memory 🧠");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
