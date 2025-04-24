// __mocks__/utils/rsiProfileScraper.js

module.exports = {
    fetchRsiProfileInfo: jest.fn().mockImplementation((rsiHandle) => {
      const mockProfiles = {
        RevAthiest: {
          handle: 'RevAthiest',
          bio: 'PFC-ABC123',
          enlisted: 'Dec 12, 2020',
          avatar: 'https://mock.url/avatar1.png',
          orgRank: 'Fleet Admiral',
          orgName: 'Pyro Freelancer Corps',
          orgId: 'PFCS'
        },
        EdgyLemons: {
          handle: 'EdgyLemons',
          bio: 'PFC-DEF456',
          enlisted: 'Jan 5, 2021',
          avatar: 'https://mock.url/avatar2.png',
          orgRank: 'Lieutenant',
          orgName: 'Pyro Freelancer Corps',
          orgId: 'PFCS'
        },
        UnaffiliatedUser: {
          handle: 'UnaffiliatedUser',
          bio: 'PFC-XYZ789',
          enlisted: 'Feb 15, 2022',
          avatar: 'https://mock.url/avatar3.png',
          orgRank: null,
          orgName: null,
          orgId: null
        }
      };
  
      const profile = mockProfiles[rsiHandle];
      if (!profile) {
        throw new Error(`Mock profile not found for handle: ${rsiHandle}`);
      }
      return Promise.resolve(profile);
    })
  };
  