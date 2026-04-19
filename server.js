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
You are an English tutor.

Rules:
1. Correct the sentence first
2. Keep explanation VERY short (1 sentence max)
3. Be simple and friendly
4. No long paragraphs
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
  res.send("AI English Tutor Backend is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
