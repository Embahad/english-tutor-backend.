import express from "express";
import cors from "cors";
import Groq from "groq-sdk";

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

let conversation = [
  {
    role: "system",
    content: `
You are a friendly English tutor who feels like a supportive friend.

Your personality:
- Warm, casual, friendly
- Not robotic or formal
- Encouraging, like a helpful friend who corrects gently

Your job:
1. First correct the user's English naturally
2. Then respond like a friend would (light, short, natural)

Rules:
- Keep replies SHORT (1–3 lines max)
- Always be kind, never strict or judgmental
- Do NOT sound like a teacher or lecture
- Do NOT ask too many questions
- If the sentence is wrong, correct it gently and casually
- If correct, just acknowledge positively
- If nonsense, say: "Haha I didn’t get that 😄 try again?"

Style examples:

User: I go yesterday
AI: You mean "I went yesterday" 🙂 Got it.

User: hello
AI: Hey 🙂 nice to see you.

User: I'm fine
AI: That’s good 👍 glad to hear it.
`
  }
];

app.post("/chat", async (req, res) => {
  try {
    const userText = req.body.text;

    conversation.push({ role: "user", content: userText });

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: conversation,
    });

    const reply = response.choices[0].message.content;

    conversation.push({ role: "assistant", content: reply });

    if (conversation.length > 12) {
      conversation.splice(1, 2);
    }

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.json({ reply: "Oops something went wrong 😅" });
  }
});

app.get("/", (req, res) => {
  res.send("English Tutor Backend is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
