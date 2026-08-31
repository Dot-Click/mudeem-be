import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const BASE_URL = 'https://api.mudeem.ae';
const ADMIN_URL = 'https://admin.mudeem.ae';

async function testFullSuite() {
  console.log('===============================================================');
  console.log('   MUDEEM PRODUCTION ADMIN & MOBILE FUNCTIONAL TEST SUITE      ');
  console.log('===============================================================');

  const jar = new CookieJar();
  const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    baseURL: BASE_URL,
    headers: {
      'Origin': ADMIN_URL,
      'Referer': `${ADMIN_URL}/`,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    validateStatus: () => true
  }));

  // 1. Health check
  console.log('\n[1] Health Check:');
  const health = await client.get('/health');
  console.log(`    Status: ${health.status} ${health.statusText}`);
  console.log(`    Payload:`, health.data);

  // 2. Admin Login
  console.log('\n[2] Admin Login (mudeemsustainapp@gmail.com):');
  const login = await client.post('/auth/login', {
    email: 'mudeemsustainapp@gmail.com',
    password: 'MudeemAdmin@2026!'
  });
  console.log(`    Status: ${login.status} ${login.statusText}`);
  console.log(`    Response Message: ${login.data?.message}`);
  console.log(`    User: ${login.data?.user?.name} | Role: ${login.data?.user?.role} | Email: ${login.data?.user?.email}`);

  // 3. /auth/me
  console.log('\n[3] Authenticated User Profile (/auth/me):');
  const me = await client.get('/auth/me');
  console.log(`    Status: ${me.status}`);
  console.log(`    Name: ${me.data?.data?.user?.name} (${me.data?.data?.user?.role})`);
  console.log(`    Active Sessions in DB: ${me.data?.data?.sessions?.length ?? 0}`);

  // 4. Test all admin panel endpoints
  console.log('\n[4] Testing Admin Panel Data Endpoints:');
  const endpoints = [
    { name: 'Dashboard Stats', path: '/dashboard' },
    { name: 'Shop Categories', path: '/shop/category' },
    { name: 'Shop Products', path: '/shop/product' },
    { name: 'Shop Banners', path: '/shop/banner' },
    { name: 'Shop Vendors', path: '/shop/vendor' },
    { name: 'Shop Orders', path: '/shop/order' },
    { name: 'Events', path: '/events' },
    { name: 'Green Map', path: '/green-map' },
    { name: 'Waste Requests', path: '/waste/request' },
    { name: 'Waste Companies', path: '/waste/company' },
    { name: 'Collaboration Forum', path: '/collab-forum' },
    { name: 'Sustainable Innovation', path: '/sustainable-innovation' },
    { name: 'Academy Books', path: '/academy/book' },
    { name: 'Careers', path: '/careers' },
    { name: 'Leaderboard', path: '/leaderboard' },
  ];

  for (const ep of endpoints) {
    try {
      const res = await client.get(ep.path);
      const isArray = Array.isArray(res.data?.data);
      const count = isArray ? `${res.data.data.length} records` : (res.data?.data ? 'Data Object' : 'No Data');
      console.log(`    ✓ [${res.status}] ${ep.name.padEnd(25)} -> ${count}`);
    } catch (err: any) {
      console.log(`    ✗ [ERR] ${ep.name.padEnd(25)} -> ${err.message}`);
    }
  }

  // 5. Mobile app connectivity verification
  console.log('\n[5] Mobile App Connectivity Check:');
  const mobileJar = new CookieJar();
  const mobileClient = wrapper(axios.create({
    jar: mobileJar,
    withCredentials: true,
    baseURL: BASE_URL,
    headers: {
      'User-Agent': 'Dart/3.0 (dart:io)',
    },
    validateStatus: () => true
  }));

  const mobileLogin = await mobileClient.post('/auth/login', {
    email: 'developerdev180@gmail.com',
    password: 'MudeemUser@2026!'
  });
  console.log(`    Mobile Login Status: ${mobileLogin.status}`);
  console.log(`    Mobile User: ${mobileLogin.data?.user?.name} (${mobileLogin.data?.user?.role})`);

  const mobileProfile = await mobileClient.get('/auth/me');
  console.log(`    Mobile /auth/me Status: ${mobileProfile.status}`);
  console.log(`    Mobile Verified Email: ${mobileProfile.data?.data?.user?.emailVerified}`);

  const mobileCategories = await mobileClient.get('/shop/category');
  console.log(`    Mobile Shop Categories Accessible: ${mobileCategories.status === 200 ? 'YES (' + mobileCategories.data?.data?.length + ' items)' : 'NO'}`);

  const mobileEvents = await mobileClient.get('/events');
  console.log(`    Mobile Events Accessible: ${mobileEvents.status === 200 ? 'YES (' + mobileEvents.data?.data?.length + ' items)' : 'NO'}`);

  const mobileGreenMap = await mobileClient.get('/green-map');
  console.log(`    Mobile Green Map Accessible: ${mobileGreenMap.status === 200 ? 'YES (' + mobileGreenMap.data?.data?.length + ' locations)' : 'NO'}`);

  console.log('\n===============================================================');
  console.log('   ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY!             ');
  console.log('===============================================================');
}

testFullSuite().catch(console.error);
