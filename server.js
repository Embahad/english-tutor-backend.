import express from "express";
import cors from "cors";
import Groq from "groq-sdk";

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post("/chat", async (req, res) => {
  try {
    const userText = req.body.text;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `
You are a friendly English tutor.

Rules:
1. If the input is NOT real English (random letters or meaningless), reply exactly:
   "That is not a valid English sentence."

2. If the sentence is correct, say naturally it's correct.
   Example: "That’s correct 👍" or "Looks good."

3. If incorrect, correct it clearly and briefly.

4. Keep responses short (1–2 lines max).

5. Do NOT guess what the user meant.
6. Do NOT say "I believe you meant..."
7. Do NOT over-explain.
8. Be natural and friendly.
          `,
        },
        { role: "user", content: userText },
      ],
    });

    res.json({
      reply: response.choices[0].message.content,
    });

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
