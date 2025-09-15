const API = process.env.API_URL || 'http://localhost:3001';

async function json(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(`Invalid JSON: ${text}`); }
}

async function main() {
  console.log('Login...');
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@kltg.local', password: 'Admin123!' })
  });
  if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
  const login = await json(loginRes);
  const token = login.token;
  console.log('Token length:', token?.length);

  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  console.log('Create truck...');
  const truckRes = await fetch(`${API}/trucks`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ model: 'Isuzu NMR', literPerKm: 0.12, plateNumber: `KH ${Math.floor(Math.random()*9000+1000)} AB`, color: 'White' })
  });
  const truck = await json(truckRes);
  console.log('Truck ID:', truck.id);

  console.log('Create delivery point...');
  const dpRes = await fetch(`${API}/delivery-points`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ name: 'RSUD Doris Sylvanus', address: 'Jl. Tambun Bungai', latitude: -2.2059, longitude: 113.9139 })
  });
  const dp = await json(dpRes);
  console.log('DeliveryPoint ID:', dp.id);

  console.log('Preview cost...');
  const params = new URLSearchParams({ destinationId: dp.id, truckId: truck.id, startAt: new Date().toISOString(), fuelPrice: '10000' });
  const previewRes = await fetch(`${API}/trips/preview/cost?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
  const preview = await json(previewRes);
  console.log('Preview:', preview);
}

main().catch((e) => { console.error(e); process.exit(1); });


