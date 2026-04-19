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
You are a friendly, natural English tutor.

Rules:
1. If the sentence is correct, say it's correct naturally.
2. Only suggest improvements if truly needed.
3. If incorrect, correct it clearly and briefly.
4. If the input is nonsense, say it's not a valid English sentence.
5. Keep responses short and human-like.
6. Avoid robotic phrases like "it is better to..."
7. Be conversational and relaxed.
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
