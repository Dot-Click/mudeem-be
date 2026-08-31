const https = require('https');
const http = require('http');

const BASE_HOST = 'api.mudeem.ae';
const ADMIN_ORIGIN = 'https://admin.mudeem.ae';

// HTTP client helper
function httpRequest({ path, method = 'GET', body = null, cookie = null, origin = ADMIN_ORIGIN, userAgent = 'Mozilla/5.0' }) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const headers = {
      'Host': BASE_HOST,
      'User-Agent': userAgent,
      'Accept': 'application/json'
    };

    if (origin) {
      headers['Origin'] = origin;
      headers['Referer'] = `${origin}/`;
    }
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
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - startTime;
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
          duration
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        headers: {},
        data: null,
        error: err.message,
        duration: Date.now() - startTime
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        statusCode: 408,
        headers: {},
        data: null,
        error: 'Timeout',
        duration: Date.now() - startTime
      });
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  return setCookie.map(c => c.split(';')[0]).join('; ');
}

// Statistical calculation helper
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

async function runTestSuite() {
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║        MUDEEM PRODUCTION ADMIN PANEL & API - COMPLETE QA & STRESS     ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

  const testResults = {
    auth: [],
    rbac: [],
    crud: [],
    security: [],
    stress: []
  };

  // -------------------------------------------------------------
  // SUITE 1: AUTHENTICATION & SESSION LIFECYCLE
  // -------------------------------------------------------------
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SUITE 1: AUTHENTICATION & SESSION MANAGEMENT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Test 1.1: Valid Admin Login
  const adminLogin = await httpRequest({
    path: '/auth/login',
    method: 'POST',
    body: { email: 'mudeemsustainapp@gmail.com', password: 'MudeemAdmin@2026!' }
  });
  const adminCookie = extractCookie(adminLogin.headers);
  const isLoginPass = adminLogin.statusCode === 200 && adminLogin.data?.user?.role === 'admin' && !!adminCookie;
  console.log(`  [${isLoginPass ? 'PASS' : 'FAIL'}] 1.1 Valid Admin Login -> Status: ${adminLogin.statusCode}, Role: ${adminLogin.data?.user?.role}, Cookie: ${adminCookie ? 'Issued' : 'None'}`);
  testResults.auth.push({ name: 'Valid Admin Login', pass: isLoginPass, status: adminLogin.statusCode });

  // Test 1.2: Invalid Password
  const badPassLogin = await httpRequest({
    path: '/auth/login',
    method: 'POST',
    body: { email: 'mudeemsustainapp@gmail.com', password: 'WrongPassword123!' }
  });
  const isBadPassPass = badPassLogin.statusCode === 400;
  console.log(`  [${isBadPassPass ? 'PASS' : 'FAIL'}] 1.2 Invalid Password Rejection -> Status: ${badPassLogin.statusCode} (${badPassLogin.data?.message})`);
  testResults.auth.push({ name: 'Invalid Password Rejection', pass: isBadPassPass, status: badPassLogin.statusCode });

  // Test 1.3: Non-existent User Login
  const noUserLogin = await httpRequest({
    path: '/auth/login',
    method: 'POST',
    body: { email: 'nonexistent_test_9999@gmail.com', password: 'SomePassword123!' }
  });
  const isNoUserPass = noUserLogin.statusCode === 400;
  console.log(`  [${isNoUserPass ? 'PASS' : 'FAIL'}] 1.3 Non-existent User Rejection -> Status: ${noUserLogin.statusCode} (${noUserLogin.data?.message})`);
  testResults.auth.push({ name: 'Non-existent User Rejection', pass: isNoUserPass, status: noUserLogin.statusCode });

  // Test 1.4: Mobile User Login (Role: 'user')
  const mobileLogin = await httpRequest({
    path: '/auth/login',
    method: 'POST',
    body: { email: 'developerdev180@gmail.com', password: 'MudeemUser@2026!' },
    origin: ''
  });
  const mobileCookie = extractCookie(mobileLogin.headers);
  const isMobileLoginPass = mobileLogin.statusCode === 200 && mobileLogin.data?.user?.role === 'user' && !!mobileCookie;
  console.log(`  [${isMobileLoginPass ? 'PASS' : 'FAIL'}] 1.4 Mobile User Login -> Status: ${mobileLogin.statusCode}, Role: ${mobileLogin.data?.user?.role}`);
  testResults.auth.push({ name: 'Mobile User Login', pass: isMobileLoginPass, status: mobileLogin.statusCode });

  // -------------------------------------------------------------
  // SUITE 2: RBAC & ACCESS CONTROL
  // -------------------------------------------------------------
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SUITE 2: ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Test 2.1: Unauthenticated request to protected endpoint
  const unauthMe = await httpRequest({ path: '/auth/me' });
  const isUnauthPass = unauthMe.statusCode === 401;
  console.log(`  [${isUnauthPass ? 'PASS' : 'FAIL'}] 2.1 Unauthenticated Request Blocked -> Status: ${unauthMe.statusCode} (Expected 401)`);
  testResults.rbac.push({ name: 'Unauthenticated Request Blocked', pass: isUnauthPass, status: unauthMe.statusCode });

  // Test 2.2: Non-admin (User) trying to access Admin-Only routes
  const adminOnlyRoutes = [
    { name: 'Create Category', path: '/shop/category', method: 'POST', body: { name: 'Unauthorized Cat', icon: 'test' } },
    { name: 'Approve Waste Request', path: '/waste/request/approve-reject/6a90036c252806b572ddfdc8', method: 'PUT', body: { status: 'approved' } },
    { name: 'Delete User by Admin', path: '/auth/user/6a90036c252806b572ddfdc8', method: 'DELETE' }
  ];

  for (const r of adminOnlyRoutes) {
    const res = await httpRequest({
      path: r.path,
      method: r.method,
      body: r.body,
      cookie: mobileCookie // Using regular user session
    });
    // Expected to fail with 401/403 or 404
    const isBlocked = res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 404;
    console.log(`  [${isBlocked ? 'PASS' : 'FAIL'}] 2.2 Non-Admin Blocked on ${r.name} -> Status: ${res.statusCode}`);
    testResults.rbac.push({ name: `RBAC Guard: ${r.name}`, pass: isBlocked, status: res.statusCode });
  }

  // -------------------------------------------------------------
  // SUITE 3: ADMIN MODULES FUNCTIONAL & CRUD VERIFICATION
  // -------------------------------------------------------------
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SUITE 3: ADMIN MODULES FUNCTIONALITY & DATA CONSISTENCY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const modulesToTest = [
    { name: 'Dashboard Analytics', path: '/dashboard', method: 'GET' },
    { name: 'Shop Categories List', path: '/shop/category', method: 'GET' },
    { name: 'Shop Products List', path: '/shop/product', method: 'GET' },
    { name: 'Shop Banners List', path: '/shop/banner', method: 'GET' },
    { name: 'Shop Vendors List', path: '/shop/vendor', method: 'GET' },
    { name: 'Shop Orders List', path: '/shop/order', method: 'GET' },
    { name: 'Events Calendar List', path: '/events', method: 'GET' },
    { name: 'Green Map Locations', path: '/green-map', method: 'GET' },
    { name: 'Waste Pickup Requests', path: '/waste/request', method: 'GET' },
    { name: 'Waste Partner Companies', path: '/waste/company', method: 'GET' },
    { name: 'Collab Forum Moderation', path: '/collab-forum', method: 'GET' },
    { name: 'Sustainable Innovation', path: '/sustainable-innovation', method: 'GET' },
    { name: 'Academy Books & Materials', path: '/academy/book', method: 'GET' },
    { name: 'Careers & Job Postings', path: '/careers', method: 'GET' },
    { name: 'Leaderboard Metrics', path: '/leaderboard', method: 'GET' }
  ];

  for (const mod of modulesToTest) {
    const res = await httpRequest({ path: mod.path, method: mod.method, cookie: adminCookie });
    const isOk = res.statusCode === 200 || res.statusCode === 201;
    const isArray = Array.isArray(res.data?.data);
    const count = isArray ? `${res.data.data.length} items` : (res.data?.data ? 'Object payload' : 'Response body');
    console.log(`  [${isOk ? 'PASS' : 'FAIL'}] ${mod.name.padEnd(28)} -> Status: ${res.statusCode} (${count}, ${res.duration}ms)`);
    testResults.crud.push({ name: mod.name, pass: isOk, status: res.statusCode, latency: res.duration });
  }

  // -------------------------------------------------------------
  // SUITE 4: SECURITY & INPUT SANITIZATION
  // -------------------------------------------------------------
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SUITE 4: SECURITY, CORS & NOSQL INJECTION RESILIENCE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Test 4.1: NoSQL Injection in Login (Object instead of string)
  const nosqlLogin = await httpRequest({
    path: '/auth/login',
    method: 'POST',
    body: { email: { '$gt': '' }, password: { '$gt': '' } }
  });
  // Should reject (400 or 500 without logging in)
  const isNoSqlSafe = nosqlLogin.statusCode !== 200;
  console.log(`  [${isNoSqlSafe ? 'PASS' : 'FAIL'}] 4.1 NoSQL Injection in Login -> Status: ${nosqlLogin.statusCode} (Not Authenticated)`);
  testResults.security.push({ name: 'NoSQL Injection Protection', pass: isNoSqlSafe, status: nosqlLogin.statusCode });

  // Test 4.2: Malformed JSON Payload
  const malformedRes = await new Promise((resolve) => {
    const req = https.request({
      hostname: BASE_HOST,
      port: 443,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Host': BASE_HOST,
        'Content-Type': 'application/json',
        'Content-Length': 15
      }
    }, (res) => {
      resolve({ statusCode: res.statusCode });
    });
    req.on('error', () => resolve({ statusCode: 500 }));
    req.write('{ broken json: ');
    req.end();
  });
  const isMalformedSafe = malformedRes.statusCode === 400 || malformedRes.statusCode === 500;
  console.log(`  [${isMalformedSafe ? 'PASS' : 'FAIL'}] 4.2 Malformed JSON Rejection -> Status: ${malformedRes.statusCode}`);
  testResults.security.push({ name: 'Malformed JSON Guard', pass: isMalformedSafe, status: malformedRes.statusCode });

  // Test 4.3: Cookie Flag Verification
  const cookieHeaders = adminLogin.headers['set-cookie'] || [];
  const sessionCookieStr = cookieHeaders.join('; ');
  const hasHttpOnly = /httponly/i.test(sessionCookieStr);
  const hasSecure = /secure/i.test(sessionCookieStr);
  const hasSameSite = /samesite=none/i.test(sessionCookieStr);
  const isCookieSecure = hasHttpOnly && hasSecure && hasSameSite;
  console.log(`  [${isCookieSecure ? 'PASS' : 'FAIL'}] 4.3 Session Cookie Security Flags -> HttpOnly: ${hasHttpOnly}, Secure: ${hasSecure}, SameSite=None: ${hasSameSite}`);
  testResults.security.push({ name: 'Session Cookie Flags', pass: isCookieSecure });

  // -------------------------------------------------------------
  // SUITE 5: HIGH-CONCURRENCY STRESS & LOAD BENCHMARKING
  // -------------------------------------------------------------
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SUITE 5: CONCURRENCY STRESS TESTING & LATENCY PROFILING');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const stressEndpoints = [
    { name: 'Authenticated /auth/me', path: '/auth/me', cookie: adminCookie, concurrency: 50 },
    { name: 'Admin Dashboard Analytics', path: '/dashboard', cookie: adminCookie, concurrency: 50 },
    { name: 'Shop Categories Catalog', path: '/shop/category', cookie: adminCookie, concurrency: 50 },
    { name: 'Public Events Endpoint', path: '/events', cookie: null, concurrency: 50 },
    { name: 'Green Map Locations', path: '/green-map', cookie: null, concurrency: 50 }
  ];

  for (const ep of stressEndpoints) {
    process.stdout.write(`  Running stress test on ${ep.name} (${ep.concurrency} concurrent requests)... `);
    const startBatch = Date.now();
    const promises = Array.from({ length: ep.concurrency }, () =>
      httpRequest({ path: ep.path, cookie: ep.cookie })
    );

    const responses = await Promise.all(promises);
    const totalBatchTime = Date.now() - startBatch;

    const latencies = responses.map(r => r.duration);
    const successCount = responses.filter(r => r.statusCode === 200 || r.statusCode === 201).length;
    const rateLimitCount = responses.filter(r => r.statusCode === 429).length;
    const errorCount = responses.filter(r => r.statusCode !== 200 && r.statusCode !== 201 && r.statusCode !== 429).length;
    const stats = calculateStats(latencies);
    const rps = ((ep.concurrency / totalBatchTime) * 1000).toFixed(1);

    console.log(`DONE!`);
    console.log(`    → Results: ${successCount}/${ep.concurrency} OK (200), ${rateLimitCount} Rate-limited (429), ${errorCount} Errors`);
    console.log(`    → Latency: min=${stats.min}ms | avg=${stats.avg}ms | p50=${stats.p50}ms | p95=${stats.p95}ms | max=${stats.max}ms`);
    console.log(`    → Throughput: ${rps} req/sec in ${totalBatchTime}ms\n`);

    testResults.stress.push({
      name: ep.name,
      concurrency: ep.concurrency,
      successCount,
      rateLimitCount,
      errorCount,
      stats,
      rps,
      totalBatchTime
    });
  }

  // -------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  QA & STRESS TESTING EXECUTION SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const allTests = [...testResults.auth, ...testResults.rbac, ...testResults.crud, ...testResults.security];
  const passed = allTests.filter(t => t.pass).length;
  const total = allTests.length;
  console.log(`  Total Functional/Security Tests: ${total}`);
  console.log(`  Passed: ${passed} | Failed: ${total - passed}`);
  console.log(`  Overall Health & Concurrency Score: ${((passed / total) * 100).toFixed(1)}% SUCCESS`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return testResults;
}

runTestSuite().catch(console.error);
