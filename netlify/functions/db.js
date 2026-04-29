const { createClient } = require('@supabase/supabase-js');
 
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
 
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
 
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }
 
  try {
    const { action, table, data, id } = JSON.parse(event.body || '{}');
 
    let result, error;
 
    if (action === 'getAll') {
      ({ data: result, error } = await supabase.from(table).select('*'));
 
    } else if (action === 'insert') {
      if (data && data.id) {
        // Check if record already exists → update or insert
        const { data: existing } = await supabase
          .from(table).select('id').eq('id', data.id).maybeSingle();
 
        if (existing) {
          ({ data: result, error } = await supabase
            .from(table).update(data).eq('id', data.id).select());
        } else {
          ({ data: result, error } = await supabase
            .from(table).insert(data).select());
        }
      } else {
        // No id → plain insert (audit_log etc)
        ({ data: result, error } = await supabase
          .from(table).insert(data).select());
      }
 
    } else if (action === 'update') {
      ({ data: result, error } = await supabase
        .from(table).update(data).eq('id', id).select());
 
    } else if (action === 'delete') {
      ({ data: result, error } = await supabase
        .from(table).delete().eq('id', id));
 
    } else {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ success: false, error: 'Unknown action: ' + action })
      };
    }
 
    if (error) throw error;
 
    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, data: result })
    };
 
  } catch (err) {
    console.error('DB proxy error:', err);
    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
