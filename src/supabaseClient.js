import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uicbzzaonvpzqtxkxgah.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpY2J6emFvbnZwenF0eGt4Z2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MzkxOTksImV4cCI6MjA2MDQxNTE5OX0.dZxeM-6U_2zVgGSNGms2en1R4YKafFvykXj6O6SzOKg';

export const supabase = createClient(supabaseUrl, supabaseKey);
