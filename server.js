import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("Giulia Backend Active 🎤");
});

// ✅ MAIN CHAT ROUTE (THIS FIXES YOUR ERROR)
app.post("/chat", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.json({ reply: "I didn't hear anything 😅 try again" });
    }

    // Simple AI logic (replace later with Groq/OpenAI if needed)
    let reply = "";

    if (text.toLowerCase().includes("hello")) {
      reply = "Hey 👋 nice to talk with you!";
    } else if (text.toLowerCase().includes("i go")) {
      reply = "You should say: 'I went' instead of 'I go' 🙂";
    } else {
      reply = `Good try 👍 You said: "${text}". Let's improve it together.`;
    }

    res.json({ reply });

  } catch (err) {
    res.json({ reply: "Server error 😅" });
  }
});

// ✅ START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Giulia backend running on port " + PORT);
});
