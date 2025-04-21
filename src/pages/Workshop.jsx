import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Sidebar from '../tempComponents/Sidebar';
import '../Styles/Workshop.css';

export default function Workshop() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: expenses } = await supabase.from('expenses').select('*').eq('user_id', user.id);
      const { data: goals } = await supabase.from('goals').select('*').eq('user_id', user.id);
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();

      setUserData({ expenses, goals, profile });
    };
    fetchData();
  }, []);

  const handleAIRequest = async (userMessage) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generateResponse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, context: userData })
      });

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('AI Error:', error);
      return "Sorry, I'm having trouble connecting to Sophia.";
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { text: input, isUser: true, timestamp: new Date().toISOString() }]);
    const aiResponse = await handleAIRequest(input);
    setMessages(prev => [...prev, { text: aiResponse, isUser: false, timestamp: new Date().toISOString() }]);
    setInput('');
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="ai-chat-container">
        <div className="chat-header">
          <h1>Sophia AI Assistant</h1>
          <p>Ask me about your finances</p>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.isUser ? 'user' : 'ai'}`}>
              <div className="message-content">
                {msg.text}
                <div className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message ai loading">
              <div className="message-content">Sophia is thinking...</div>
            </div>
          )}
        </div>

        <form className="chat-input" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your financial question..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </main>
    </div>
  );
}
