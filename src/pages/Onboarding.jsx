import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const [income, setIncome] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [dependents, setDependents] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserEmail(user.email);
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error("Authentication failed. Please log in again.");
      }

      const profileData = {
        user_id: user.id, // Changed to match Supabase column name (lowercase)
        email: user.email,
        income: income ? parseInt(income) : 0,
        age: age ? parseInt(age) : 0,
        location: location || 'Not specified',
        dependents: dependents ? parseInt(dependents) : 0
      };

      const { error } = await supabase
        .from('profiles') // Ensure correct table name (lowercase)
        .upsert(profileData, {
          onConflict: 'user_id' // Handle existing users
        });

      if (error) {
        console.error('Supabase Error:', error);
        throw error;
      }

      navigate('/home');
    } catch (error) {
      alert(`Submission failed: ${error.message}`);
      console.error('Error details:', error);
    }
  };

  return (
    <div className="onboarding-container">
      <h1>Complete Your Profile</h1>
      <form onSubmit={handleSubmit} className="profile-form">
        {/* Existing form fields remain the same */}
        {/* ... */}
      </form>
    </div>
  );
}