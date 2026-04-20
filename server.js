import express from "express";
import cors from "cors";
import Groq from "groq-sdk";

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// basic fluency score from speech confidence
function getScore(confidence) {
  if (confidence > 0.9) return 9;
  if (confidence > 0.8) return 8;
  if (confidence > 0.7) return 7;
  if (confidence > 0.6) return 6;
  return 5;
}

app.post("/chat", async (req, res) => {
  try {
    const { text, confidence = 0.8 } = req.body;

    const score = getScore(confidence);

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `
You are Giulia, a speaking coach.

YOUR JOB:
- Talk naturally like a human
- Help the user improve pronunciation and fluency
- Give feedback like a real tutor

STYLE:
- Friendly, encouraging, slightly playful
- Short responses (1–3 lines)
- No robotic formatting

COACHING MODE:
- If user speaks → give feedback
- Mention clarity and fluency
- Suggest improvement casually
- Occasionally give a new sentence to repeat

EXAMPLES:

User speaks  
Giulia: That was pretty clear 🙂 maybe slow down a bit on the last word

User speaks well  
Giulia: Nice 👏 that sounded smooth!

User struggles  
Giulia: Hmm a bit unclear there 😅 try saying it slower: “I went yesterday”

IMPORTANT:
- Sound like a real person
- Not a system
`
        },
        {
          role: "user",
          content: `User said: "${text}" with confidence ${confidence} (score ${score}/10)`
        }
      ],
    });

    let reply = response.choices[0].message.content;

    // attach score naturally
    reply += `\n\n🎤 Score: ${score}/10`;

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.json({ reply: "Error 😅 try again" });
  }
});

app.get("/", (req, res) => {
  res.send("Giulia Speaking Coach Active 🎤");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));
