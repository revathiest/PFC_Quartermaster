// __tests__/testUtils/mockBuilders.js

function buildMockInteraction({ existingVerifiedUser }) {
  return {
    user: { id: '12345', username: 'TestUser' },
    member: { displayName: 'TestUser', setNickname: jest.fn() },
    options: { getString: jest.fn().mockReturnValue('TestHandle') },
    deferReply: jest.fn().mockResolvedValue(),
    editReply: jest.fn().mockResolvedValue(),
    guild: { roles: mockRoles },
  };
}

function buildMockButtonInteraction(testCase) {
  return {
    customId: 'verify_now::TestHandle::PFC-ABC123',
    user: { id: '12345', username: 'TestUser' },
    member: {
      displayName: 'TestUser',
      setNickname: jest.fn(),
      roles: {
        cache: {
          has: jest.fn().mockReturnValue(true),
        },
        remove: jest.fn().mockResolvedValue(),
        add: jest.fn().mockResolvedValue()
      }
    },
    deferUpdate: jest.fn().mockResolvedValue(),
    editReply: jest.fn().mockResolvedValue(),
    guild: { roles: mockRoles }
  };
}

module.exports = { buildMockInteraction, buildMockButtonInteraction };
