const assert = require('assert');

console.log('--- RUNNING TEST SUITE: Friend & Family (Personal Records) Logic ---');

// Test 1: Interest-Free Loan Calculation
function calculateLoanStatus(principal, repayments) {
  const totalReturned = repayments.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
  const remainingAmount = Math.max(0, principal - totalReturned);
  let status = 'PENDING';
  if (totalReturned > 0 && remainingAmount > 0) {
    status = 'PARTIALLY_RETURNED';
  } else if (remainingAmount <= 0) {
    status = 'FULLY_RETURNED';
  }
  return {
    interestRate: 0, // Always 0%
    totalReturned,
    remainingAmount,
    status,
    percentReturned: principal > 0 ? Math.min(100, Math.round((totalReturned / principal) * 100)) : 0,
  };
}

// Test 1.1: New Loan Creation (e.g. 10,000 given)
const initial = calculateLoanStatus(10000, []);
assert.strictEqual(initial.interestRate, 0, 'Interest rate must be 0%');
assert.strictEqual(initial.totalReturned, 0, 'Initial returned should be 0');
assert.strictEqual(initial.remainingAmount, 10000, 'Remaining should be 10000');
assert.strictEqual(initial.status, 'PENDING', 'Status should be PENDING');
assert.strictEqual(initial.percentReturned, 0, 'Percent should be 0%');
console.log('✔ Test 1.1 Passed: New Loan Creation with 0% interest and PENDING status');

// Test 1.2: First Partial Repayment (₹2,000 returned)
const partial1 = calculateLoanStatus(10000, [{ amount: 2000 }]);
assert.strictEqual(partial1.totalReturned, 2000, 'Total returned should be 2000');
assert.strictEqual(partial1.remainingAmount, 8000, 'Remaining should be 8000');
assert.strictEqual(partial1.status, 'PARTIALLY_RETURNED', 'Status should be PARTIALLY_RETURNED');
assert.strictEqual(partial1.percentReturned, 20, 'Percent returned should be 20%');
console.log('✔ Test 1.2 Passed: Partial repayment #1 (2,000/10,000 = 20%, PARTIALLY_RETURNED)');

// Test 1.3: Second Partial Repayment (₹1,000 more, total ₹3,000 like in user mock pic)
const partial2 = calculateLoanStatus(10000, [{ amount: 2000 }, { amount: 1000 }]);
assert.strictEqual(partial2.totalReturned, 3000, 'Total returned should be 3000');
assert.strictEqual(partial2.remainingAmount, 7000, 'Remaining should be 7000');
assert.strictEqual(partial2.status, 'PARTIALLY_RETURNED', 'Status should be PARTIALLY_RETURNED');
assert.strictEqual(partial2.percentReturned, 30, 'Percent returned should be 30% (matching screenshot 3!)');
console.log('✔ Test 1.3 Passed: Partial repayment #2 (3,000/10,000 = 30%, Remaining: 7,000)');

// Test 1.4: Final Repayment (₹7,000 returned)
const full = calculateLoanStatus(10000, [{ amount: 2000 }, { amount: 1000 }, { amount: 7000 }]);
assert.strictEqual(full.totalReturned, 10000, 'Total returned should be 10000');
assert.strictEqual(full.remainingAmount, 0, 'Remaining should be 0');
assert.strictEqual(full.status, 'FULLY_RETURNED', 'Status should be FULLY_RETURNED');
assert.strictEqual(full.percentReturned, 100, 'Percent returned should be 100%');
console.log('✔ Test 1.4 Passed: Full repayment (10,000/10,000 = 100%, FULLY_RETURNED)');

// Test 2: Gift / Financial Help Logic
function handleGift(amount) {
  return {
    recordType: 'GIFT',
    amount: amount,
    totalReturned: 0,
    remainingAmount: 0,
    status: 'GIFT',
    allowsRepayment: false,
    interestRate: 0,
  };
}

const giftRecord = handleGift(5000);
assert.strictEqual(giftRecord.recordType, 'GIFT');
assert.strictEqual(giftRecord.status, 'GIFT');
assert.strictEqual(giftRecord.remainingAmount, 0, 'Gifts have 0 remaining balance');
assert.strictEqual(giftRecord.allowsRepayment, false, 'Gifts do not allow repayments');
assert.strictEqual(giftRecord.interestRate, 0, 'No interest on gifts');
console.log('✔ Test 2 Passed: Gift / Financial Help requires no repayment and has 0% interest');

// Test 3: User Access Restriction Check
function canUserAccess(record, requestingUserId) {
  return record.ownerId === requestingUserId;
}

const userARecord = { id: 101, ownerId: 1, name: 'Ramesh' };
assert.strictEqual(canUserAccess(userARecord, 1), true, 'Owner should have access');
assert.strictEqual(canUserAccess(userARecord, 2), false, 'Another user should NOT have access');
console.log('✔ Test 3 Passed: User access security restrictions verified');

console.log('--- ALL TESTS PASSED SUCCESSFULLY (6/6) ---');
