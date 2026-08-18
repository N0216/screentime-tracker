// Vercel Serverless Function
// 这个文件要放在项目根目录下的 api 文件夹里，命名为 screentime.js

// 用内存临时存储（重启会丢失，但够测试用）
// 生产环境建议接入数据库，但那样更复杂
let records = [];

export default function handler(req, res) {
  // 设置跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { pathname, query } = new URL(req.url, `http://${req.headers.host}`);

  // 接收iPhone发来的使用记录
  if (pathname.startsWith('/api/screentime/toggle/') && req.method === 'GET') {
    const appName = pathname.split('/').pop();
    const action = query.action || 'unknown'; // open 或 close
    const timestamp = new Date().toISOString();

    const record = {
      app: appName,
      action: action,
      time: timestamp
    };

    records.push(record);

    return res.status(200).json({ status: 'ok', saved: record });
  }

  // 查询记录（给你调用的接口）
  if (pathname === '/api/screentime/query' && req.method === 'GET') {
    const hours = parseInt(query.hours || '24');
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;

    const filteredRecords = records.filter(r => {
      return new Date(r.time).getTime() >= cutoffTime;
    });

    // 按时间倒序
    filteredRecords.sort((a, b) => new Date(b.time) - new Date(a.time));

    return res.status(200).json({ records: filteredRecords });
  }

  return res.status(404).json({ error: 'Not Found' });
}

