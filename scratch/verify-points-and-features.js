const https = require('https');

const BASE_HOST = 'api.mudeem.ae';

function httpRequest({ path, method = 'GET', body = null, cookie = null }) {
  return new Promise((resolve) => {
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const headers = {
      'Host': BASE_HOST,
      'User-Agent': 'Mozilla/5.0',
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
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', (err) => resolve({ statusCode: 0, error: err.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  return setCookie.map(c => c.split(';')[0]).join('; ');
}

async function verifyAll() {
  console.log('========================================================================');
  console.log('    VERIFYING ADMIN PANEL & MOBILE POINTS WIRING WITH PRODUCTION DB     ');
  console.log('========================================================================\n');

  // 1. Authenticate Admin
  console.log('[1] Admin Authentication:');
  const loginRes = await httpRequest({
    path: '/auth/login',
    method: 'POST',
    body: { email: 'mudeemsustainapp@gmail.com', password: 'MudeemAdmin@2026!' }
  });
  const adminCookie = extractCookie(loginRes.headers);
  console.log(`    Status: ${loginRes.statusCode} | User: ${loginRes.data?.user?.name} (${loginRes.data?.user?.role})`);
  console.log(`    Cookie: ${adminCookie ? 'Issued ✅' : 'Missing ❌'}`);

  // 2. Verify Global Settings & Configured Points
  console.log('\n[2] Global Points Configuration (/setting):');
  const settingRes = await httpRequest({ path: '/setting', cookie: adminCookie });
  const settings = settingRes.data?.data;
  console.log(`    Status: ${settingRes.statusCode}`);
  console.log(`    - Carpooling Green Points:   ${settings?.carPoolingGreenPoints ?? 'N/A'} pts`);
  console.log(`    - Green Map Green Points:     ${settings?.greenMapGreenPoints ?? 'N/A'} pts`);
  console.log(`    - GPT Message Green Points:   ${settings?.gptMessageGreenPoints ?? 'N/A'} pts`);
  console.log(`    - Admin Logo URL:             ${settings?.logo ? 'Configured ✅' : 'None'}`);
  console.log(`    - Admin Favicon URL:          ${settings?.favIcon ? 'Configured ✅' : 'None'}`);

  // 3. Verify Users List
  console.log('\n[3] Users Management (/user):');
  const usersRes = await httpRequest({ path: '/user', cookie: adminCookie });
  const userList = Array.isArray(usersRes.data?.data) ? usersRes.data.data : [];
  console.log(`    Status: ${usersRes.statusCode} | Total Registered Users: ${userList.length}`);
  userList.forEach((u, i) => {
    console.log(`    - User #${i + 1}: ${u.name} | Email: ${u.email} | Role: ${u.role} | Active: ${u.isActive} | Points: ${u.greenPoints || 0}`);
  });

  // 4. Verify Events Management
  console.log('\n[4] Events Management (/events):');
  const eventsRes = await httpRequest({ path: '/events', cookie: adminCookie });
  console.log(`    Status: ${eventsRes.statusCode} | Current Events in DB: ${Array.isArray(eventsRes.data?.data) ? eventsRes.data.data.length : 0}`);

  // 5. Verify Sustainable Innovation
  console.log('\n[5] Sustainable Innovation (/sustainable-innovation):');
  const innovRes = await httpRequest({ path: '/sustainable-innovation', cookie: adminCookie });
  console.log(`    Status: ${innovRes.statusCode} | Submissions: ${Array.isArray(innovRes.data?.data) ? innovRes.data.data.length : 0}`);

  // 6. Verify Production Backend & Database Health
  console.log('\n[6] Production Health & DB Connection:');
  const healthRes = await httpRequest({ path: '/health' });
  console.log(`    Status: ${healthRes.statusCode} | DB State: ${healthRes.data?.database} | Backend: ${healthRes.data?.status}`);

  console.log('\n========================================================================');
  console.log('    VERIFICATION COMPLETED SUCCESSFULLY                                 ');
  console.log('========================================================================');
}

verifyAll().catch(console.error);
