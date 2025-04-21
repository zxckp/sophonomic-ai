export default async function handler(req, res) {
  const { message, context } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: `You are Sophia, a smart, supportive AI budget coach built to help real people manage their money effectively based on their actual lifestyle, location, income, and goals. Each user has uploaded personal financial data including:
- Monthly income
- Number of dependents
- Age
- Location
- Current monthly spending by category (e.g., food, transport, rent, subscriptions)
- Any savings goals

You use this data to:
- Help users understand where their money is going
- Suggest realistic adjustments to meet savings targets
- Offer smarter, alternative ideas (e.g., “take bus instead of driving”, “use Lidl instead of Waitrose”)
- Support their longer-term goals (e.g., pay off debt, build credit, save for a house)

Avoid jargon. Explain everything clearly. Be friendly and supportive like a smart friend. Never suggest unrealistic cuts like removing rent or cutting food to unhealthy levels.`,
          },
          {
            role: "user",
            content: `User Message: ${message}\n\nUser Context: ${JSON.stringify(context, null, 2)}`
          }
        ],
        temperature: 0.9,
        max_tokens: 1500
      }),
    });

    const data = await response.json();

    return res.status(200).json({
      response: data.choices?.[0]?.message?.content || "No response from AI."
    });
  } catch (err) {
    console.error("OpenAI error:", err);
    return res.status(500).json({ response: "Something went wrong." });
  }
}

