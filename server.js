import express from "express";
import cors from "cors";
import Groq from "groq-sdk";

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// 🧠 TEMP MEMORY (per session)
let conversation = [
  {
    role: "system",
    content: `
You are a friendly, modern English tutor.

Rules:
1. Maintain natural conversation flow (do NOT restart conversation each time).
2. If input is nonsense → "That is not a valid English sentence."
3. If correct → respond naturally (no overreaction).
4. If incorrect → correct briefly.
5. If idiom/slang → explain briefly.
6. Keep responses short and human-like.
`
  }
];

app.post("/chat", async (req, res) => {
  try {
    const userText = req.body.text;

    // add user message
    conversation.push({ role: "user", content: userText });

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: conversation,
    });

    const reply = response.choices[0].message.content;

    // add AI reply to memory
    conversation.push({ role: "assistant", content: reply });

    // 🔥 prevent memory getting too big
    if (conversation.length > 10) {
      conversation.splice(1, 2);
    }

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.json({ reply: "Error processing request" });
  }
});

app.get("/", (req, res) => {
  res.send("English Tutor Backend is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
