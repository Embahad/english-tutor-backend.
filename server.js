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

/* ---------------- MEMORY ---------------- */

function loadMemory() {
  if (!fs.existsSync(MEMORY_FILE)) {
    return {
      name: "friend",
      stats: {
        totalMessages: 0,
        correctSentences: 0,
        mistakes: 0,
        xp: 0,
        level: 1
      },
      mistakeLog: []
    };
  }
  return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
}

function saveMemory(data) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
}

/* ---------------- LEVEL SYSTEM ---------------- */

function calculateLevel(xp) {
  if (xp < 5) return 1;
  if (xp < 15) return 2;
  if (xp < 30) return 3;
  return 4;
}

/* ---------------- BASIC ERROR DETECTION ---------------- */

function isLikelyIncorrect(text) {
  const t = text.toLowerCase();
  return (
    t.includes(" i go ") ||
    t.includes(" i is ") ||
    t.includes(" he go ") ||
    /^[a-z]{6,}$/i.test(text)
  );
}

/* ---------------- SERVER ---------------- */

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
You are Giulia, a friendly English tutor, vocabulary coach, and sentence upgrader.

PERSONALITY:
- Warm, friendly, slightly funny
- Feels like a real tutor-friend
- Encouraging and supportive

CORE JOB:
1. Correct English first (if needed)
2. Then upgrade the sentence:
   - make it more natural OR
   - more advanced OR
   - use idioms/proverbs when appropriate

RULES:
- Keep reply MAX 3 lines
- Always show correction first
- Then improved version
- Be simple and clear
- Do NOT over-explain grammar
- Be natural like a human tutor

USER INFO:
- Name: ${memory.name}
- Level: ${memory.stats.level}
- XP: ${memory.stats.xp}

LEVELS:
1 = Beginner
2 = Elementary
3 = Intermediate
4 = Advanced
`
        },
        { role: "user", content: userText }
      ],
    });

    let reply = response.choices[0].message.content;

    /* ---------------- UPDATE STATS ---------------- */

    if (likelyWrong) {
      memory.stats.mistakes++;
      memory.stats.xp += 1;
      memory.mistakeLog.push(userText);
    } else {
      memory.stats.correctSentences++;
      memory.stats.xp += 2;
    }

    /* ---------------- LEVEL UP ---------------- */

    const newLevel = calculateLevel(memory.stats.xp);

    if (newLevel > memory.stats.level) {
      memory.stats.level = newLevel;
      reply += `\n\n🏆 Level Up! You are now Level ${newLevel}`;
    }

    /* ---------------- NAME MEMORY ---------------- */

    if (userText.toLowerCase().includes("my name is")) {
      const name = userText.split("is")[1]?.trim();
      if (name) memory.name = name;
    }

    saveMemory(memory);

    /* ---------------- PROGRESS FEEDBACK ---------------- */

    if (memory.stats.totalMessages % 5 === 0) {
      reply += `\n\n📊 XP: ${memory.stats.xp} | Level: ${memory.stats.level}`;
    }

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.json({ reply: "Error 😅 something went wrong" });
  }
});

app.get("/", (req, res) => {
  res.send("Giulia is fully upgraded 🎓📊");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));
