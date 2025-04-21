import { useState } from 'react';

export default function Workshop() {
  const [userInput, setUserInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const response = await fetch('https://YOUR-VERCEL-APP.vercel.app/api/generateResponse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userInput }),
    });

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content;

    setAiResponse(message);
    setLoading(false);
  }

  return (
    <div>
      <h1>Talk to Sophia</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Ask a budgeting question..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Thinking...' : 'Submit'}
        </button>
      </form>

      {aiResponse && (
        <div>
          <h2>Sophia says:</h2>
          <p>{aiResponse}</p>
        </div>
      )}
    </div>
  );
}
