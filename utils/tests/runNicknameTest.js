const { formatVerifiedNickname } = require('../formatVerifiedNickname');

const testCases = [
  { displayName: 'RevAthiest ⛔', verified: true, tag: 'PFCS', expected: '[PFCS] RevAthiest' },
  { displayName: 'RevAthiest 🔒 ⚠️ ⛔', verified: true, tag: 'PFCS', expected: '[PFCS] RevAthiest' },
  { displayName: '[PFCS] RevAthiest ⛔', verified: true, tag: 'PFCS', expected: '[PFCS] RevAthiest' },
  { displayName: 'RevAthiest', verified: true, tag: 'PFCS', expected: '[PFCS] RevAthiest' },
  { displayName: 'RevAthiest', verified: false, tag: 'PFCS', expected: '[PFCS] RevAthiest ⛔' },
  { displayName: 'RevAthiest', verified: false, tag: null, expected: 'RevAthiest ⛔' },
  { displayName: 'RevAthiest ⛔', verified: false, tag: null, expected: 'RevAthiest ⛔' },
  { displayName: 'RevAthiest 🔒 ⚠️ ⛔', verified: false, tag: null, expected: 'RevAthiest ⛔' },
  { displayName: '[OLD] RevAthiest ⚠', verified: false, tag: 'PFCS', expected: '[PFCS] RevAthiest ⛔' },
  { displayName: 'SuperLongNameThatExceedsThirtyTwoChars ⛔', verified: false, tag: null, expected: 'SuperLongNameThatExceedsThirty ⛔' },
  { displayName: '✅ RevAthiest ⛔', verified: true, tag: 'PFCS', expected: '[PFCS] ✅ RevAthiest' },
  { displayName: '[PFCS] ✅ RevAthiest ⚠️', verified: true, tag: 'PFCS', expected: '[PFCS] ✅ RevAthiest' },
];

function runNicknameTests() {
  console.log('=== Running Nickname Formatter Tests ===');
  testCases.forEach((test, index) => {
    const output = formatVerifiedNickname(test.displayName, test.verified, test.tag);
    const pass = output === test.expected;

    console.log(`\n[TEST ${index + 1}]`);
    console.log(`Input: displayName="${test.displayName}", verified=${test.verified}, tag=${test.tag}`);
    console.log(`Expected: "${test.expected}"`);
    console.log(`Got     : "${output}"`);
    console.log(pass ? '✅ PASS' : '❌ FAIL');
  });
  console.log('=== Tests Completed ===');
}

runNicknameTests();