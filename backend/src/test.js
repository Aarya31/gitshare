const assert = require('assert');
const mongoose = require('mongoose');

// Override Port for testing
process.env.PORT = 5099;
process.env.NODE_ENV = 'test';

async function runTests() {
  console.log('--- STARTING INTEGRATION TESTS FOR GITSHARE ---');
  
  // Load index.js which boots DB connection and Express server on port 5099
  const index = require('./index');
  
  // Wait for connection to be ready
  await new Promise(resolve => setTimeout(resolve, 2500));

  const User = require('./models/User');
  const Repository = require('./models/Repository');

  // Clean test database first
  console.log('Cleaning test database...');
  await User.deleteMany({});
  await Repository.deleteMany({});
  console.log('Test database cleaned.');

  const BASE_URL = 'http://localhost:5099/api';
  let authToken = '';
  let testRepoId = '';

  try {
    // 1. Test registration
    console.log('Testing User Registration...');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
      })
    });
    
    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 201, `Expected 201, got ${regRes.status}: ${JSON.stringify(regData)}`);
    assert.strictEqual(regData.user.username, 'testuser');
    assert.ok(regData.token, 'Registration should return a token');
    console.log('✓ Registration successful!');

    // 2. Test login
    console.log('Testing User Login...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
      })
    });
    
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200, `Expected 200, got ${loginRes.status}`);
    assert.ok(loginData.token, 'Login should return a token');
    authToken = loginData.token;
    console.log('✓ Login successful!');

    // 3. Test get me
    console.log('Testing Fetch Current User (Auth Guard)...');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const meData = await meRes.json();
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meData.user.username, 'testuser');
    console.log('✓ Auth guard and token validation successful!');

    // 4. Test repository creation
    console.log('Testing Repository Creation...');
    const createRepoRes = await fetch(`${BASE_URL}/repositories`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}` 
      },
      body: JSON.stringify({
        name: 'my-test-repo',
        description: 'Integration test description'
      })
    });
    const repoData = await createRepoRes.json();
    assert.strictEqual(createRepoRes.status, 201, `Expected 201, got ${createRepoRes.status}: ${JSON.stringify(repoData)}`);
    assert.strictEqual(repoData.name, 'my-test-repo');
    testRepoId = repoData._id;
    console.log('✓ Repository creation successful!');

    // 5. Test fetching repositories list
    console.log('Testing Fetch Repositories List...');
    const listRes = await fetch(`${BASE_URL}/repositories`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const listData = await listRes.json();
    assert.strictEqual(listRes.status, 200);
    assert.ok(Array.isArray(listData));
    assert.strictEqual(listData.length, 1);
    assert.strictEqual(listData[0].name, 'my-test-repo');
    console.log('✓ Fetch repositories list successful!');

    console.log('\n======================================');
    console.log('  ALL INTEGRATION TESTS PASSED SUCCESSFULLY!  ');
    console.log('======================================');

  } catch (err) {
    console.error('❌ Test execution failed:', err);
    process.exit(1);
  } finally {
    // Cleanup connection
    if (global.__MONGO_SERVER__) {
      await global.__MONGO_SERVER__.stop();
    }
    await mongoose.connection.close();
    process.exit(0);
  }
}

runTests();
