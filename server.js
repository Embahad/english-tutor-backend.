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
  if (!fs.existsSync(MEMORY_FILE)) {
    return {
      name: "friend",
      stats: {
        totalMessages: 0,
        correctSentences: 0,
        mistakes: 0
      },
      mistakeLog: []
    };
  }
  return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
}

// 🧠 Save memory
function saveMemory(data) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
}

// 🧠 Simple mistake detection
function isLikelyIncorrect(text) {
  const lower = text.toLowerCase();
  return (
    lower.includes(" i go ") ||
    lower.includes(" i is ") ||
    lower.includes(" he go ") ||
    /^[a-z]{6,}$/i.test(text) // random letters
  );
}

app.post("/chat", async (req, res) => {
  try {
    const userText = req.body.text;

    let memory = loadMemory();

    memory.stats.totalMessages++;

    const likelyWrong = isLikelyIncorrect(userText);

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `
You are Giulia, a friendly English tutor with progress tracking.

USER STATS:
- Messages: ${memory.stats.totalMessages}
- Mistakes: ${memory.stats.mistakes}
- Correct: ${memory.stats.correctSentences}

RULES:
1. Always correct English first
2. Be friendly and human
3. Keep replies short (1–3 lines)
4. Encourage improvement
5. Be slightly funny sometimes
6. Do NOT be robotic
`
        },
        { role: "user", content: userText }
      ],
    });

    let reply = response.choices[0].message.content;

    // 📊 UPDATE STATS
    if (likelyWrong) {
      memory.stats.mistakes++;
      memory.mistakeLog.push(userText);
    } else {
      memory.stats.correctSentences++;
    }

    // 🧠 NAME MEMORY
    if (userText.toLowerCase().includes("my name is")) {
      const name = userText.split("is")[1]?.trim();
      if (name) memory.name = name;
    }

    saveMemory(memory);

    // 📊 OPTIONAL PROGRESS FEEDBACK
    if (memory.stats.totalMessages % 5 === 0) {
      reply += `\n\n📊 Progress: ${memory.stats.correctSentences} correct, ${memory.stats.mistakes} mistakes so far.`;
    }

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.json({ reply: "Error 😅 something went wrong" });
  }
});

app.get("/", (req, res) => {
  res.send("Giulia with Progress Tracking is running 📊");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));
