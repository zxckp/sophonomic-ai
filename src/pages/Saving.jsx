//SAVINGS FUNCTION IS GOOD, NEED IT TO READ FROM THE BUDGET THAT'S SET THOUGH
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../Styles/Saving.css';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function Saving() {
  const [categories, setCategories] = useState([]);
  const [inputs, setInputs] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Authentication failed');

        // Get ALL expense categories (including essential)
        const { data: expenses, error: expensesError } = await supabase
          .from('expenses')
          .select('category')
          .eq('user_id', user.id);

        if (expensesError) throw new Error('Failed to load expenses');

        // Get existing budgets
        const { data: budgets, error: budgetsError } = await supabase
          .from('budgets')
          .select('category, amount')
          .eq('user_id', user.id);

        if (budgetsError) throw new Error('Failed to load budgets');

        // Get actual spending for month
        const monthStart = startOfMonth(selectedMonth).toISOString();
        const monthEnd = endOfMonth(selectedMonth).toISOString();
        
        const { data: actualSpending, error: spendingError } = await supabase
          .from('expenses')
          .select('category, amount')
          .eq('user_id', user.id)
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd);

        if (spendingError) throw new Error('Failed to load actual spending');

        // Merge and deduplicate categories
        const expenseCategories = [...new Set(expenses.map(e => e.category))];
        const budgetCategories = budgets.map(b => b.category);
        const allCategories = [...new Set([...expenseCategories, ...budgetCategories])];

        // Initialize inputs with proper fallbacks
        const initialInputs = {};
        allCategories.forEach(category => {
          const budget = budgets.find(b => b.category === category)?.amount || 0;
          const actual = (actualSpending || [])
            .filter(a => a.category === category)
            .reduce((sum, a) => sum + (a.amount || 0), 0);

          initialInputs[category] = { budget, actual };
        });

        setCategories(allCategories);
        setInputs(initialInputs);
        setStatusMessage('');

      } catch (error) {
        console.error('Data fetch error:', error);
        setStatusMessage(`Error: ${error.message}`);
        setCategories([]);
      }
    };

    fetchData();
  }, [selectedMonth]);


  const saveBudgetData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const month = selectedMonth.toISOString();
      
      // Prepare budget updates
      const budgetUpdates = categories.map(category => ({
        user_id: user.id,
        category,
        amount: inputs[category]?.budget || 0
      }));

      // Save budgets
      const { error: budgetError } = await supabase.from('budgets').upsert(budgetUpdates, {
        onConflict: 'user_id, category'
      });

      if (budgetError) throw budgetError;

      // Prepare savings data
      const savingsUpdates = categories.map(category => {
        const difference = inputs[category].budget - inputs[category].actual;
        return {
          user_id: user.id,
          category,
          amount: difference > 0 ? difference : 0,
          date: month
        };
      });

      // Save savings
      const { error: savingsError } = await supabase.from('savings').upsert(savingsUpdates, {
        onConflict: 'user_id, category, date'
      });

      if (savingsError) throw savingsError;

      setStatusMessage('✅ Data saved! Redirecting...');
      setTimeout(() => navigate('/home'), 1500);
    } catch (error) {
      console.error('Save error:', error);
      setStatusMessage(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="saving-container">
      <Sidebar />
      
      <div className="main-content">
        <h1>Monthly Budget Tracking</h1>
        
        <div className="controls">
          <input
            type="month"
            value={format(selectedMonth, 'yyyy-MM')}
            onChange={(e) => setSelectedMonth(new Date(e.target.value))}
            className="month-picker"
          />
          <button 
            className="save-button" 
            onClick={saveBudgetData}
            disabled={!categories.length}
          >
            Save All Changes
          </button>
        </div>

        {categories.length > 0 ? (
          <div className="category-grid">
            {categories.map((category, index) => (
              <div key={index} className="category-card">
                <h3>{category}</h3>
                
                <div className="input-group">
                  <label>Budgeted Amount (£)</label>
                  <input
                    type="number"
                    value={inputs[category]?.budget || 0}
                    onChange={(e) => handleInputChange(category, 'budget', e.target.value)}
                    min="0"
                    step="1"
                  />
                </div>

                <div className="input-group">
                  <label>Actual Spent (£)</label>
                  <input
                    type="number"
                    value={inputs[category]?.actual || 0}
                    onChange={(e) => handleInputChange(category, 'actual', e.target.value)}
                    min="0"
                    step="1"
                  />
                </div>

                <div className="difference-display">
                  {inputs[category]?.budget - inputs[category]?.actual >= 0 ? (
                    <span className="under-budget">
                      Under by £{inputs[category].budget - inputs[category].actual}
                    </span>
                  ) : (
                    <span className="over-budget">
                      Over by £{Math.abs(inputs[category].budget - inputs[category].actual)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No categories found. Add expenses first!</p>
            <button onClick={() => navigate('/profile')}>
              Go to Profile
            </button>
          </div>
        )}

        {statusMessage && (
          <div className={`status-message ${statusMessage.includes('✅') ? 'success' : 'error'}`}>
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
}