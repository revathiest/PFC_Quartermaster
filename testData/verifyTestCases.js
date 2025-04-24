// testData/verifyTestCases.js
module.exports = [
    {
      name: 'Existing verification linked to another user',
      interactionSetup: { existingVerifiedUser: { discordUserId: '67890' } },
      expected: { contentIncludes: 'already linked to another Discord user' }
    },
    {
      name: 'Successful execution and instructions sent',
      interactionSetup: { existingVerifiedUser: null },
      expected: { contentIncludes: "Let's get you verified" }
    },
    {
      name: 'Missing verification code in bio',
      buttonInteraction: true,
      rsiProfile: { handle: 'TestHandle', bio: 'No code here', orgId: 'PFCS' },
      expected: { contentIncludes: "Couldn't find the code" }
    },
    {
      name: 'Successful verification and nickname update',
      buttonInteraction: true,
      rsiProfile: { handle: 'TestHandle', bio: 'PFC-ABC123', orgId: 'PFCS' },
      orgTag: { tag: 'PFC' },
      expected: { contentIncludes: "You're verified as **TestHandle**" }
    }
  ];
  