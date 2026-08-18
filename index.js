export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 处理跨域
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 接收iPhone发来的使用记录
    if (url.pathname.startsWith('/api/screentime/toggle/') && request.method === 'GET') {
      const appName = url.pathname.split('/').pop();
      const action = url.searchParams.get('action') || 'unknown'; // open 或 close
      const timestamp = new Date().toISOString();
      
      // 存储到KV（Cloudflare的键值存储）
      const key = `record_${Date.now()}_${appName}`;
      const record = {
        app: appName,
        action: action,
        time: timestamp
      };
      
      await env.SCREENTIME_DATA.put(key, JSON.stringify(record));
      
      return new Response(JSON.stringify({ status: 'ok', saved: record }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 查询记录（给我调用的接口）
    if (url.pathname === '/api/screentime/query' && request.method === 'GET') {
      const hours = parseInt(url.searchParams.get('hours') || '24');
      const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
      
      const list = await env.SCREENTIME_DATA.list();
      const records = [];
      
      for (const key of list.keys) {
        const timestamp = parseInt(key.name.split('_')[1]);
        if (timestamp >= cutoffTime) {
          const data = await env.SCREENTIME_DATA.get(key.name);
          records.push(JSON.parse(data));
        }
      }
      
      // 按时间倒序
      records.sort((a, b) => new Date(b.time) - new Date(a.time));
      
      return new Response(JSON.stringify({ records }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};
