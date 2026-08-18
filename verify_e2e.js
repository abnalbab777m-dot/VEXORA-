import fetch from 'node-fetch';
import { db } from './src/db/index.js';
import { users, walletTransactions, wallets } from './src/db/schema.js';
import { authService } from './src/backend/services/authService.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const API_URL = 'http://localhost:3000/api';

async function run() {
  console.log('--- STARTING VERIFICATION TESTS ---');
  
  // 1. Setup
  const allUsers = await db.select().from(users);
  let admin = allUsers.find(u => u.role === 'ADMIN');
  let player = allUsers.find(u => u.username === 'TestPlayer2');
  if (!player) {
    player = (await db.insert(users).values({ username: 'TestPlayer2', email: 'test2@vexora.com', passwordHash: 'hash' }).returning())[0];
  }
  
  const adminToken = authService.generateToken(admin.id, admin.role);
  const playerToken = authService.generateToken(player.id, player.role);
  
  // Get wallet initial balance
  let wallet = await db.query.wallets.findFirst({ where: eq(wallets.userId, player.id) });
  if (!wallet) {
    wallet = (await db.insert(wallets).values({ userId: player.id }).returning())[0];
  }
  const initialBalance = Number(wallet.balance);

  // 2. Fetch Payment Methods
  const pmRes = await fetch(`${API_URL}/wallet/payment-methods`, { headers: { cookie: `token=${playerToken}` } });
  const pmData = await pmRes.json();
  const paymentMethods = pmData.data;
  
  // TEST 1: 4.99 USD Deposit
  console.log('\n[TEST 1] Deposit 4.99 USD');
  const req1 = await fetch(`${API_URL}/wallet/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: `token=${playerToken}` },
    body: JSON.stringify({ amount: '4.99', idempotencyKey: crypto.randomUUID(), paymentMethodId: paymentMethods[0].id })
  });
  console.log(`Request: POST /api/wallet/deposit (4.99 USD)`);
  console.log(`Expected Status: 400`);
  console.log(`Actual Status: ${req1.status}`);

  // TEST 2 & 3: 5.00 USD Deposit for all 4 methods
  let txIds = [];
  for (const pm of paymentMethods) {
    console.log(`\n[TEST] Deposit 5.00 USD using ${pm.name}`);
    const req = await fetch(`${API_URL}/wallet/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: `token=${playerToken}` },
      body: JSON.stringify({ amount: '5.00', idempotencyKey: crypto.randomUUID(), paymentMethodId: pm.id })
    });
    console.log(`Request: POST /api/wallet/deposit (5.00 USD) - ${pm.name}`);
    console.log(`Expected Status: 200`);
    console.log(`Actual Status: ${req.status}`);
    
    if (req.status === 200) {
      const data = await req.json();
      txIds.push(data.data.id);
      
      // Verify DB
      const dbTx = await db.query.walletTransactions.findFirst({ where: eq(walletTransactions.id, data.data.id) });
      console.log(`Database Result: ID=${dbTx.id}, Status=${dbTx.status}, Amount=${dbTx.amount}, PM_ID in Metadata=${dbTx.metadata?.paymentMethodId}`);
    }
  }

  // TEST 4: Admin Approve 5 USD Deposit
  const targetTxId = txIds[0];
  console.log('\n[TEST 4] Admin Approve 5 USD Deposit');
  const appReq = await fetch(`${API_URL}/admin/transactions/${targetTxId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: `token=${adminToken}` }
  });
  console.log(`Request: POST /api/admin/transactions/${targetTxId}/approve`);
  console.log(`Expected Status: 200`);
  console.log(`Actual Status: ${appReq.status}`);
  
  // Check Balance
  const updatedWallet = await db.query.wallets.findFirst({ where: eq(wallets.userId, player.id) });
  console.log(`Database Result: Old Balance=${initialBalance}, New Balance=${updatedWallet.balance}`);

  // TEST 5: Double Approve Check
  console.log('\n[TEST 5] Admin Double Approve Check');
  const dblAppReq = await fetch(`${API_URL}/admin/transactions/${targetTxId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: `token=${adminToken}` }
  });
  console.log(`Request: POST /api/admin/transactions/${targetTxId}/approve (AGAIN)`);
  console.log(`Expected Status: 400`);
  console.log(`Actual Status: ${dblAppReq.status}`);
  const dblAppData = await dblAppReq.json();
  console.log(`Error Message: ${dblAppData.error?.message}`);

  const finalWallet = await db.query.wallets.findFirst({ where: eq(wallets.userId, player.id) });
  console.log(`Database Result: Final Balance=${finalWallet.balance} (Should match New Balance)`);

  process.exit(0);
}
run();
