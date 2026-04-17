const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qfkswmskollpngnmsduc.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const KV_TABLE = 'kv_store_2fad19e1';

const getSupabaseClient = (isServiceRole = false) => {
  return createClient(SUPABASE_URL, isServiceRole ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY);
};

const kvGet = async (key) => {
  const supabase = getSupabaseClient(true);
  const { data, error } = await supabase.from(KV_TABLE).select('value').eq('key', key).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value ?? null;
};

const kvSet = async (key, value) => {
  const supabase = getSupabaseClient(true);
  const { error } = await supabase.from(KV_TABLE).upsert({ key, value }, { onConflict: 'key' });
  if (error) throw new Error(error.message);
};

const kvGetByPrefix = async (prefix) => {
  const supabase = getSupabaseClient(true);
  const { data, error } = await supabase.from(KV_TABLE).select('key, value').like('key', prefix + '%');
  if (error) throw new Error(error.message);
  return data ?? [];
};

module.exports = {
  getSupabaseClient,
  kvGet,
  kvSet,
  kvGetByPrefix
};
