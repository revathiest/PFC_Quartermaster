const { formatVerifiedNickname } = require('../../utils/formatVerifiedNickname');

const testCases = [
    // CLEAN TAG REPLACEMENT TESTS
    { displayName: 'RevAthiest ⛔', verified: true, tag: 'PFCS', expected: '[PFCS] RevAthiest' },                       // Replace tag, verified, clean ⛔
    { displayName: 'RevAthiest 🔒 ⚠️ ⛔', verified: true, tag: 'PFCS', expected: '[PFCS] RevAthiest' },                // Replace tag, verified, clean all junk
    { displayName: '[PFCS] RevAthiest ⛔', verified: true, tag: 'PFCS', expected: '[PFCS] RevAthiest' },              // Tag correct, clean ⛔
    { displayName: 'RevAthiest', verified: true, tag: 'PFCS', expected: '[PFCS] RevAthiest' },                       // Add tag, no junk, verified
  
    { displayName: 'RevAthiest', verified: false, tag: 'PFCS', expected: '[PFCS] RevAthiest ⛔' },                   // Add tag, unverified, ⛔ added
    { displayName: 'RevAthiest', verified: false, tag: null, expected: 'RevAthiest ⛔' },                            // No tag provided, unverified
  
    // EXISTING TAG RETENTION TESTS
    { displayName: '[OLD] RevAthiest ⚠', verified: true, tag: null, expected: '[OLD] RevAthiest' },                  // Leave existing tag, clean junk, verified
    { displayName: '[OLD] RevAthiest ⚠', verified: false, tag: null, expected: '[OLD] RevAthiest ⛔' },              // Leave tag, clean junk, add ⛔ for unverified
  
    // TRUNCATION EDGE CASE
    { displayName: 'SuperLongNameThatExceedsThirtyTwoChars ⛔', verified: false, tag: null, expected: 'SuperLongNameThatExceedsThirty ⛔' },
  
    // JUNK CLEANUP TESTS WITH DEDUPE
    { displayName: '✅ ✅ RevAthiest ⛔', verified: true, tag: 'PFCS', expected: '[PFCS] RevAthiest' },                // Remove ✅ junk
    { displayName: '✅ RevAthiest ⛔', verified: true, tag: 'PFCS', expected: '[PFCS] RevAthiest' },                  // Remove ✅
    { displayName: '[PFCS] ✅ RevAthiest ⚠️', verified: true, tag: 'PFCS', expected: '[PFCS] RevAthiest' },          // Remove ✅, clean junk, correct tag
  
    // VERIFIED WITH NO TAG
    { displayName: 'RevAthiest', verified: true, tag: null, expected: 'RevAthiest' },                               // No tag, verified, clean
];
  

describe('formatVerifiedNickname', () => {
    testCases.forEach(({ displayName, verified, tag, expected }) => {
      test(
        `formats nickname correctly: verified=${verified}, tag=${tag}, displayName="${displayName}", expected="${expected}"`,
        () => {
          const result = formatVerifiedNickname(displayName, verified, tag);
          expect(result).toBe(expected);
          // Optional: Log the result for your own sanity (remove in production)
          console.log(`Result for "${displayName}": ${result}`);
        }
      );
    });
  });  
