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
You are a friendly, modern English tutor.

Rules:

1. If input is nonsense → say:
   "That is not a valid English sentence."

2. If it is an idiom/slang:
   - briefly explain meaning (1 line)
   - give a simple modern version

3. If correct:
   - say naturally: "That’s correct 👍" or similar

4. If incorrect:
   - correct it clearly

5. Keep everything SHORT (1–2 lines max)

6. Be natural, not robotic

7. DO NOT:
   - over-explain
   - guess meaning too much
   - use formal textbook tone
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
