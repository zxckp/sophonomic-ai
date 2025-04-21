export default async function handler(req, res) {
  const { message, context } = req.body;

  try {
    console.log("🚀 Received message:", message);
    console.log("🔑 API Key present:", !!process.env.OPENAI_API_KEY);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-1106-preview", // or use "gpt-4-turbo"
        messages: [
          {
            role: "system",
            content: "You are Sophia, a friendly budgeting assistant. Respond kindly and clearly. If context is given, personalize your answers.",
          },
          {
            role: "user",
            content: `User Message: ${message}\n\nUser Context: ${JSON.stringify(context, null, 2)}`
          }
        ],
      }),
    });

    const data = await response.json();

    return res.status(200).json({
      response: data.choices?.[0]?.message?.content || "No response from AI."
    });
  } catch (err) {
    console.error("❌ OpenAI error:", err);
    return res.status(500).json({ response: "Something went wrong." });
  }
}
