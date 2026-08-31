const https = require('https');

const BASE_HOST = 'api.mudeem.ae';

function httpRequest({ path, method = 'GET', body = null, cookie = null }) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const headers = {
      'Host': BASE_HOST,
      'User-Agent': 'Mudeem-Stress-Test/1.0',
      'Accept': 'application/json'
    };

    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    const req = https.request({
      hostname: BASE_HOST,
      port: 443,
      path: path,
      method: method,
      headers: headers,
      timeout: 20000
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          duration: Date.now() - startTime
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        error: err.message,
        duration: Date.now() - startTime
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        statusCode: 408,
        error: 'Timeout',
        duration: Date.now() - startTime
      });
    });

    if (payload) req.write(payload);
    req.end();
  });
}

function calculateStats(latencies) {
  if (!latencies.length) return { min: 0, max: 0, avg: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const p = (pct) => sorted[Math.min(Math.floor((pct / 100) * sorted.length), sorted.length - 1)];
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round(sum / sorted.length),
    p50: p(50),
    p90: p(90),
    p95: p(95),
    p99: p(99)
  };
}

async function run100Stress() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('       100 CONCURRENT REQUESTS STRESS TEST & BURST LATENCY     ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Authenticate admin
  const loginRes = await httpRequest({
    path: '/auth/login',
    method: 'POST',
    body: { email: 'mudeemsustainapp@gmail.com', password: 'MudeemAdmin@2026!' }
  });
  const cookie = loginRes.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ');

  const targets = [
    { name: 'Shop Categories (Authenticated Admin)', path: '/shop/category', cookie },
    { name: 'Events Calendar (Public / Auth)', path: '/events', cookie: null },
    { name: 'Green Map Markers (Public / Auth)', path: '/green-map', cookie: null },
    { name: 'Dashboard Analytics (Heavy Aggregation)', path: '/dashboard', cookie }
  ];

  for (const t of targets) {
    process.stdout.write(`Executing 100 concurrent requests on: ${t.name}... `);
    const start = Date.now();
    const promises = Array.from({ length: 100 }, () => httpRequest({ path: t.path, cookie: t.cookie }));
    const responses = await Promise.all(promises);
    const totalTime = Date.now() - start;

    const latencies = responses.map(r => r.duration);
    const ok = responses.filter(r => r.statusCode === 200 || r.statusCode === 201).length;
    const rateLimited = responses.filter(r => r.statusCode === 429).length;
    const failed = responses.filter(r => r.statusCode !== 200 && r.statusCode !== 201 && r.statusCode !== 429).length;
    const stats = calculateStats(latencies);
    const rps = ((100 / totalTime) * 1000).toFixed(1);

    console.log('COMPLETED');
    console.log(`  ✓ Success Rate: ${ok}/100 (${ok}%) | Rate Limited: ${rateLimited} | Errors: ${failed}`);
    console.log(`  ✓ Latency (ms): Min=${stats.min}ms | Avg=${stats.avg}ms | p50=${stats.p50}ms | p95=${stats.p95}ms | Max=${stats.max}ms`);
    console.log(`  ✓ Throughput:   ${rps} req/sec (100 reqs completed in ${totalTime}ms)\n`);
  }
}

run100Stress().catch(console.error);
