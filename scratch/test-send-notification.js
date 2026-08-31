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

async function run() {
  console.log('1. Admin Login:');
  const login = await httpRequest({
    path: '/auth/login',
    method: 'POST',
    body: { email: 'mudeemsustainapp@gmail.com', password: 'MudeemAdmin@2026!' }
  });
  const cookie = extractCookie(login.headers);
  console.log('Login Status:', login.statusCode, '| Cookie:', cookie ? 'OK' : 'FAIL');

  console.log('\n2. Testing /notification/send:');
  const sendRes = await httpRequest({
    path: '/notification/send',
    method: 'POST',
    cookie: cookie,
    body: {
      title: '🌿 Welcome to Mudeem Eco Community!',
      content: 'Start earning green points by recycling, carpooling, and exploring sustainable innovation!',
      target: 'all'
    }
  });

  console.log('Send Response Status:', sendRes.statusCode);
  console.log('Send Response Data:', sendRes.data);

  console.log('\n3. Fetching Notifications to Verify In-App Delivery:');
  const allNotifs = await httpRequest({
    path: '/notification/all',
    cookie: cookie
  });
  console.log('Notifications in DB:', Array.isArray(allNotifs.data?.data) ? allNotifs.data.data.length : allNotifs.data);
  if (Array.isArray(allNotifs.data?.data) && allNotifs.data.data.length > 0) {
    console.log('Latest Notification:', {
      title: allNotifs.data.data[0]?.title,
      content: allNotifs.data.data[0]?.content,
      user: allNotifs.data.data[0]?.user?.name,
      createdAt: allNotifs.data.data[0]?.createdAt
    });
  }
}

run().catch(console.error);
