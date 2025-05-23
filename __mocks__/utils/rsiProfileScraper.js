// __mocks__/utils/rsiProfileScraper.js

module.exports = {
  fetchRsiProfileInfo: jest.fn().mockImplementation((rsiHandle) => {
    const mockProfiles = {
      // Verified, fully affiliated
      RevAthiest: {
        handle: 'RevAthiest',
        bio: 'PFC-ABC123',
        enlisted: 'Dec 12, 2020',
        avatar: 'https://mock.url/avatar1.png',
        orgRank: 'Fleet Admiral',
        orgName: 'Pyro Freelancer Corps',
        orgId: 'PFCS'
      },
      // Verified, affiliated, missing avatar
      NoAvatarUser: {
        handle: 'NoAvatarUser',
        bio: 'PFC-NOAVATAR',
        enlisted: 'Jan 1, 2021',
        avatar: null,
        orgRank: 'Commander',
        orgName: 'Pyro Freelancer Corps',
        orgId: 'PFCS'
      },
      // Verified, unaffiliated (no org info)
      UnaffiliatedUser: {
        handle: 'UnaffiliatedUser',
        bio: 'PFC-XYZ789',
        enlisted: 'Feb 15, 2022',
        avatar: 'https://mock.url/avatar3.png',
        orgRank: null,
        orgName: null,
        orgId: null
      },
      // Unverified user scenario (org info but treated as unverified elsewhere)
      EdgyLemons: {
        handle: 'EdgyLemons',
        bio: 'PFC-DEF456',
        enlisted: 'Jan 5, 2021',
        avatar: 'https://mock.url/avatar2.png',
        orgRank: 'Lieutenant',
        orgName: 'Pyro Freelancer Corps',
        orgId: 'PFCS'
      },
      // Edge case: Missing multiple fields (avatar, rank, bio)
      HalfBakedUser: {
        handle: 'HalfBakedUser',
        bio: '',
        enlisted: '',
        avatar: null,
        orgRank: null,
        orgName: 'Pyro Freelancer Corps',
        orgId: 'PFCS'
      },
    };

    const profile = mockProfiles[rsiHandle];
    if (!profile) {
      const error = new Error(`Mock profile not found for handle: ${rsiHandle}`);
      error.code = 'PROFILE_NOT_FOUND';
      throw error;
    }
    return Promise.resolve(profile);
  })
};
