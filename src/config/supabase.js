const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Service Key must be provided.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const verifySupabaseUser = async (userId) => {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) {
    return { user: null, error };
  }
  return { user: data.user, error: null };
};

const getSupabaseUser = async (userId) => {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error) {
      return { user: null, error };
    }
    return { user: data.user, error: null };
};

module.exports = {
  supabase,
  verifySupabaseUser,
  getSupabaseUser,
};
