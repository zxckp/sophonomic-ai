import { useEffect, useState } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import '../Styles/Home.css';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Import logos (store these in public/images folder)
const subscriptionLogos = {
  'Netflix': '/images/netflix.png',
  'Amazon Prime': '/images/amazon-prime.png',
  'Now TV': '/images/now-tv.png',
  'Spotify': '/images/spotify.png'
};

Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

export default function Home() {
  const [spendingData, setSpendingData] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [savingsData, setSavingsData] = useState([]);
  const [goals, setGoals] = useState([]);
  const [showAddSub, setShowAddSub] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', amount: '', due_date: '' });
  const [newGoal, setNewGoal] = useState({ title: '', target: '', date: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: expenses } = await supabase
        .from('expenses')
        .select('category, amount')
        .eq('user_id', user.id);

      const { data: subs } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('next_due', { ascending: true });

      const { data: savings } = await supabase
        .from('savings')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);

      setSpendingData(expenses || []);
      setSubscriptions(subs || []);
      setSavingsData(savings || []);
      setGoals(goals || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Chart configurations
  const doughnutData = {
    labels: spendingData.map(item => item.category),
    datasets: [{
      data: spendingData.map(item => item.amount),
      backgroundColor: ['#3A86FF', '#8338EC', '#FF006E', '#FB5607', '#FFBE0B'],
      hoverOffset: 4,
      borderWidth: 0,
    }]
  };

  const lineData = {
    labels: savingsData.map(item => format(new Date(item.date), 'MMM dd')),
    datasets: [{
      label: 'Total Saved',
      data: savingsData.map(item => item.amount),
      borderColor: '#79d685',
      tension: 0.4,
      pointRadius: 5,
      pointBackgroundColor: '#79d685'
    }]
  };

  // Subscription handlers
  const addSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('subscriptions')
      .insert([{ 
        ...newSub,
        user_id: user.id,
        next_due: newSub.due_date 
      }]);

    if (!error) {
      setSubscriptions([...subscriptions, newSub]);
      setShowAddSub(false);
      setNewSub({ name: '', amount: '', due_date: '' });
    }
  };

  const deleteSubscription = async (id) => {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id);

    if (!error) {
      setSubscriptions(subscriptions.filter(sub => sub.id !== id));
      // Add to savings
      const subAmount = subscriptions.find(sub => sub.id === id)?.amount || 0;
      await supabase
        .from('savings')
        .insert([{ 
          amount: subAmount, 
          date: new Date().toISOString(),
          user_id: (await supabase.auth.getUser()).data.user.id 
        }]);
    }
  };

  // Goal handlers
  const addGoal = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('goals')
      .insert([{ 
        ...newGoal,
        user_id: user.id,
        target_date: newGoal.date 
      }]);

    if (!error) {
      setGoals([...goals, newGoal]);
      setNewGoal({ title: '', target: '', date: '' });
    }
  };

  return (
    <div className="home-container">
      <Sidebar />
      
      <div className="main-content">
        <div className="chart-row">
          <div className="savings-card">
            <h2>Savings Progress</h2>
            <div className="chart-wrapper">
              <Line 
                data={lineData}
                options={{
                  responsive: true,
                  scales: {
                    y: {
                      title: { display: true, text: 'Amount Saved (£)' },
                      beginAtZero: true
                    },
                    x: {
                      title: { display: true, text: 'Date' }
                    }
                  }
                }}
              />
            </div>
            <button 
              className="import-button"
              onClick={() => navigate('/import')}
            >
              Import Data
            </button>
          </div>

          <div className="overview-card">
            <h2>Spending Overview</h2>
            {spendingData.length > 0 ? (
              <div className="chart-wrapper">
                <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
              </div>
            ) : (
              <div className="empty-state">
                <button onClick={() => navigate('/profile')}>
                  Add Spending Data
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="subscriptions-card">
          <div className="subscriptions-header">
            <h2>Subscriptions</h2>
            <div 
              className="add-sub-box"
              onClick={() => setShowAddSub(!showAddSub)}
            >
              <div className="plus">+</div>
              <p>Add Subscription</p>
            </div>
          </div>

          {showAddSub && (
            <div className="sub-form">
              <select
                value={newSub.name}
                onChange={(e) => setNewSub({...newSub, name: e.target.value})}
              >
                <option value="">Select Service</option>
                {Object.keys(subscriptionLogos).map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
                <option value="custom">Custom</option>
              </select>

              {newSub.name === 'custom' && (
                <input
                  type="text"
                  placeholder="Service Name"
                  value={newSub.customName}
                  onChange={(e) => setNewSub({...newSub, name: e.target.value})}
                />
              )}

              <input
                type="number"
                placeholder="Amount (£)"
                value={newSub.amount}
                onChange={(e) => setNewSub({...newSub, amount: e.target.value})}
              />

              <input
                type="date"
                value={newSub.due_date}
                onChange={(e) => setNewSub({...newSub, due_date: e.target.value})}
              />

              <button onClick={addSubscription}>Add</button>
            </div>
          )}

          <div className="subscriptions-list">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="subscription-item">
                <div className="sub-info">
                  {subscriptionLogos[sub.name] ? (
                    <img src={subscriptionLogos[sub.name]} alt={sub.name} className="sub-logo" />
                  ) : (
                    <div className="custom-logo">{sub.name.charAt(0)}</div>
                  )}
                  <div>
                    <h3>{sub.name}</h3>
                    <p>Renews: {format(new Date(sub.next_due), 'do MMMM yyyy')}</p>
                  </div>
                </div>
                <div className="sub-actions">
                  <span>£{sub.amount}</span>
                  <button onClick={() => deleteSubscription(sub.id)}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="goals-card">
          <h2>Financial Goals</h2>
          <div className="goal-form">
            <input
              type="text"
              placeholder="Goal title"
              value={newGoal.title}
              onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
            />
            <input
              type="number"
              placeholder="Target amount"
              value={newGoal.target}
              onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
            />
            <input
              type="date"
              value={newGoal.date}
              onChange={(e) => setNewGoal({...newGoal, date: e.target.value})}
            />
            <button onClick={addGoal}>Add Goal</button>
          </div>

          <div className="goals-list">
            {goals.map((goal) => (
              <div key={goal.id} className="goal-item">
                <h3>{goal.title}</h3>
                <p>Target: £{goal.target} by {format(new Date(goal.target_date), 'do MMMM yyyy')}</p>
                <progress value={goal.current || 0} max={goal.target} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}