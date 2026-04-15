const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL     = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

exports.handler = async (event) => {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { action, table, data, id, filters } = JSON.parse(event.body || '{}');

    let result;

    switch (action) {

      // ── READ ALL ──────────────────────────────────────────
      case 'getAll': {
        let query = supabase.from(table).select('*');
        if (filters) {
          Object.entries(filters).forEach(([col, val]) => {
            query = query.eq(col, val);
          });
        }
        const { data: rows, error } = await query;
        if (error) throw error;
        result = rows;
        break;
      }

      // ── INSERT ────────────────────────────────────────────
      case 'insert': {
        const { data: inserted, error } = await supabase
          .from(table)
          .insert(data)
          .select();
        if (error) throw error;
        result = inserted;
        break;
      }

      // ── UPDATE ────────────────────────────────────────────
      case 'update': {
        const { data: updated, error } = await supabase
          .from(table)
          .update(data)
          .eq('id', id)
          .select();
        if (error) throw error;
        result = updated;
        break;
      }

      // ── DELETE ────────────────────────────────────────────
      case 'delete': {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      // ── UPSERT (insert or update) ─────────────────────────
      case 'upsert': {
        const { data: upserted, error } = await supabase
          .from(table)
          .upsert(data)
          .select();
        if (error) throw error;
        result = upserted;
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, data: result }),
    };

  } catch (err) {
    console.error('DB Function Error:', err);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
