import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../Styles/Profile.css';

const ESSENTIAL_CATEGORIES = [
  'Rent/Mortgage',
  'Bills (Water/Electricity/Gas)',
  'Food',
  'Transport',
  'Subscriptions'
];

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    income: '',
    email: '',
    location: '',
    dependents: '',
    age: ''
  });
  const [expenses, setExpenses] = useState([]);
  const [showCustom, setShowCustom] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: '', amount: '' });
  const [expenseChanges, setExpenseChanges] = useState({});

  // INITIAL DATA LOAD
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        // Load profile and expenses in parallel
        const [profileRes, expensesRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', user.id).single(),
          supabase.from('expenses').select('*').eq('user_id', user.id)
        ]);

        // Handle missing essential expenses
        const existingCategories = expensesRes.data?.map(e => e.category) || [];
        const missingEssentials = ESSENTIAL_CATEGORIES.filter(c => !existingCategories.includes(c));

        if (missingEssentials.length > 0) {
          const { data: newExpenses } = await supabase
            .from('expenses')
            .insert(missingEssentials.map(category => ({
              user_id: user.id,
              category,
              amount: 0,
              is_essential: true
            })))
            .select();

          setExpenses([...(expensesRes.data || []), ...(newExpenses || [])]);
        } else {
          setExpenses(expensesRes.data || []);
        }

        setProfile({
          income: profileRes.data?.income || '',
          email: user.email,
          location: profileRes.data?.location || '',
          dependents: profileRes.data?.dependents || '',
          age: profileRes.data?.age || ''
        });
      } catch (error) {
        console.error('Data load error:', error);
        alert('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // FIXED SANITIZE FUNCTION
  const sanitizeNumber = (value) => {
    const stringValue = String(value || '');
    const clean = stringValue.replace(/[^0-9.]/g, '');
    return clean === '' ? '' : Math.max(0, parseFloat(clean));
  };

  const handleExpenseChange = (category, value) => {
    setExpenseChanges(prev => ({
      ...prev,
      [category]: sanitizeNumber(value)
    }));
  };

  // SAVE EXPENSE CHANGES
  const saveExpenseChanges = async () => {
    try {
      const updates = Object.entries(expenseChanges).map(([category, amount]) => {
        const expense = expenses.find(e => e.category === category);
        return supabase
          .from('expenses')
          .update({ amount: Number(amount) || 0 })
          .eq('id', expense.id);
      });

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) throw errors;
      
      setExpenses(expenses.map(e => 
        expenseChanges[e.category] !== undefined 
          ? { ...e, amount: Number(expenseChanges[e.category]) || 0 } 
          : e
      ));
      setExpenseChanges({});
    } catch (error) {
      console.error('Save failed:', error);
      alert('Error saving expenses');
    }
  };

  // ADD CUSTOM EXPENSE - FULLY FIXED
  const addCustomExpense = async () => {
    try {
      if (!newExpense.category.trim()) return;

      const { data: { user } } = await supabase.auth.getUser();
      const amount = sanitizeNumber(newExpense.amount) || 0;

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          category: newExpense.category.trim(),
          amount: Number(amount),
          is_essential: false
        })
        .select();

      if (error) throw error;

      setExpenses(prev => [...prev, data[0]]);
      setNewExpense({ category: '', amount: '' });
      setShowCustom(false);
    } catch (error) {
      console.error('Add expense error:', error);
      alert(`Failed to add expense: ${error.message}`);
    }
  };

  // SAVE PROFILE
  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('profiles').upsert({
        user_id: user.id,
        ...profile
      });

      if (profile.email !== user.email) {
        await supabase.auth.updateUser({ email: profile.email });
      }
      alert('Profile saved successfully');
    } catch (error) {
      console.error('Save profile error:', error);
      alert('Error saving profile');
    }
  };

  if (loading) return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="loading">Loading...</div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="profile-container">
          <h1>Profile Settings</h1>

          {/* Expenses Sections */}
          <section className="section-card">
            <h2 className="section-label">Monthly Essential Expenses</h2>
            {ESSENTIAL_CATEGORIES.map(category => {
              const expense = expenses.find(e => e.category === category);
              const value = expenseChanges[category] ?? expense?.amount;
              
              return (
                <div key={category} className="expense-row">
                  <label>{category}</label>
                  <div className="amount-input">
                    <span>£</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={value === 0 ? '' : value?.toString()}
                      onChange={(e) => handleExpenseChange(category, e.target.value)}
                      onKeyPress={(e) => !/[0-9.]/.test(e.key) && e.preventDefault()}
                    />
                  </div>
                </div>
              );
            })}
            <button 
              className="save-button"
              onClick={saveExpenseChanges}
              disabled={!Object.keys(expenseChanges).length}
            >
              Save Expense Changes
            </button>
          </section>

          {/* Additional Expenses */}
          <section className="section-card">
            <h2 className="section-label">Additional Expenses</h2>
            <button 
              className="toggle-custom"
              onClick={() => setShowCustom(!showCustom)}
            >
              {showCustom ? 'Cancel' : '+ Add Other Expenses'}
            </button>

            {showCustom && (
              <div className="custom-expense-form">
                <input
                  placeholder="Expense Title"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense(p => ({ ...p, category: e.target.value }))}
                />
                <div className="amount-input">
                  <span>£</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Amount"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(p => ({
                      ...p,
                      amount: sanitizeNumber(e.target.value)
                    }))}
                    onKeyPress={(e) => !/[0-9.]/.test(e.key) && e.preventDefault()}
                  />
                </div>
                <button 
                  className="save-button" 
                  onClick={addCustomExpense}
                  disabled={!newExpense.category.trim() || !newExpense.amount}
                >
                  Add Expense
                </button>
              </div>
            )}

            {expenses
              .filter(e => !ESSENTIAL_CATEGORIES.includes(e.category))
              .map(expense => (
                <div key={expense.id} className="expense-row">
                  <label>{expense.category}</label>
                  <div className="amount-input">
                    <span>£</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={expense.amount?.toString()}
                      onChange={(e) => handleExpenseChange(expense.category, e.target.value)}
                      onKeyPress={(e) => !/[0-9.]/.test(e.key) && e.preventDefault()}
                    />
                  </div>
                </div>
              ))}
          </section>

          {/* Profile Information */}
          <section className="section-card">
            <h2 className="section-label">Profile Information</h2>
            <form onSubmit={saveProfile}>
              <div className="form-grid">
                {['income', 'email', 'location', 'dependents', 'age'].map((field) => (
                  <div key={field} className="form-group">
                    <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                    {field === 'email' || field === 'location' ? (
                      <input
                        type={field === 'email' ? 'email' : 'text'}
                        value={profile[field]}
                        onChange={(e) => setProfile(p => ({ ...p, [field]: e.target.value }))}
                      />
                    ) : (
                      <input
                        type="text"
                        inputMode="numeric"
                        value={profile[field]}
                        onChange={(e) => setProfile(p => ({
                          ...p,
                          [field]: sanitizeNumber(e.target.value)
                        }))}
                        onKeyPress={(e) => !/[0-9.]/.test(e.key) && e.preventDefault()}
                      />
                    )}
                  </div>
                ))}
                <div className="form-group">
                  <label>Password</label>
                  <button
                    type="button"
                    className="password-reset"
                    onClick={() => navigate('/reset-password')}
                  >
                    Reset Password
                  </button>
                </div>
              </div>
              <button type="submit" className="save-button">
                Save Profile Changes
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}