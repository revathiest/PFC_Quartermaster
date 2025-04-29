
const { fetchRsiProfileInfo } = require('../../../utils/rsiProfileScraper');
const { VerifiedUser } = require('../../../config/database');
const whois = require('../../../commands/user/whois');
const { EmbedBuilder } = require('discord.js');

jest.mock('../../../utils/rsiProfileScraper');
jest.mock('../../../config/database');

// Suppress expected console.error and console.warn during tests
beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterAll(() => {
    console.error.mockRestore();
    console.warn.mockRestore();
  });  

describe('/whois command', () => {
  const mockInteraction = () => {
    const user = { id: '123', tag: 'TestUser#0001', displayAvatarURL: jest.fn(() => 'https://avatar.url') };
    return {
      options: {
        getUser: jest.fn(() => user),
      },
      guild: {
        members: {
          cache: {
            get: jest.fn(() => ({ user })),
          }
        }
      },
      user,
      deferReply: jest.fn(),
      editReply: jest.fn(),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('responds with profile embed for verified user', async () => {
    const interaction = mockInteraction();

    VerifiedUser.findByPk.mockResolvedValue({ rsiHandle: 'TestHandle' });

    fetchRsiProfileInfo.mockResolvedValue({
      handle: 'TestHandle',
      avatar: 'https://cdn.test/avatar.png',
      bio: 'Test bio',
      enlisted: 'Jan 1, 2020',
      orgName: 'Test Org',
      orgId: 'ORG123',
      orgRank: 'Ensign',
    });

    await whois.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalledWith({ flags: 64 });
    expect(interaction.editReply).toHaveBeenCalled();

    const reply = interaction.editReply.mock.calls[0][0];
    expect(reply.embeds).toHaveLength(1);
    const embed = reply.embeds[0].toJSON();

    expect(embed.fields).toEqual(expect.arrayContaining([
      { name: 'Organization', value: 'Test Org', inline: true },
      { name: 'SID', value: 'ORG123', inline: true },
      { name: 'Rank', value: 'Ensign', inline: true },
      { name: 'Enlisted', value: 'Jan 1, 2020', inline: true },
    ]));
  });

  it('responds with fallback values for missing fields', async () => {
    const interaction = mockInteraction();
    VerifiedUser.findByPk.mockResolvedValue({ rsiHandle: 'TestHandle' });

    fetchRsiProfileInfo.mockResolvedValue({
      handle: 'TestHandle',
      avatar: 'https://cdn.test/avatar.png',
      bio: '',
      enlisted: '',
      orgName: '',
      orgId: null,
      orgRank: null,
    });

    await whois.execute(interaction);

    const embed = interaction.editReply.mock.calls[0][0].embeds[0].toJSON();
    expect(embed.fields).toEqual(expect.arrayContaining([
      { name: 'Organization', value: 'None listed', inline: true },
      { name: 'SID', value: 'Not listed', inline: true },
      { name: 'Rank', value: 'Not listed', inline: true },
      { name: 'Enlisted', value: 'Not listed', inline: true },
    ]));
  });

  it('does not set thumbnail if avatar is invalid', async () => {
    const interaction = mockInteraction();
    VerifiedUser.findByPk.mockResolvedValue({ rsiHandle: 'TestHandle' });

    fetchRsiProfileInfo.mockResolvedValue({
      handle: 'TestHandle',
      avatar: 'javascript:void(0)',
      bio: 'Some bio',
      enlisted: 'May 4, 2020',
      orgName: 'Test Org',
      orgId: 'ORG001',
      orgRank: 'Captain',
    });

    await whois.execute(interaction);
    const embed = interaction.editReply.mock.calls[0][0].embeds[0].toJSON();
    expect(embed.thumbnail).toBeUndefined();
  });

  it('handles unverified user gracefully', async () => {
    const interaction = mockInteraction();
    VerifiedUser.findByPk.mockResolvedValue(null);

    await whois.execute(interaction);
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('has not verified'),
      })
    );
  });

  it('handles scraper errors gracefully', async () => {
    const interaction = mockInteraction();
    VerifiedUser.findByPk.mockResolvedValue({ rsiHandle: 'TestHandle' });
    fetchRsiProfileInfo.mockRejectedValue(new Error('Scraper broke'));

    await whois.execute(interaction);
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Failed to fetch'),
      })
    );
  });

  it('handles missing Organization name gracefully', async () => {
    const interaction = mockInteraction();
    VerifiedUser.findByPk.mockResolvedValue({ rsiHandle: 'TestHandle' });

    fetchRsiProfileInfo.mockResolvedValue({
      handle: 'TestHandle',
      avatar: 'https://cdn.test/avatar.png',
      bio: 'Test bio',
      enlisted: 'Jan 1, 2020',
      orgName: '',
      orgId: 'ORG123',
      orgRank: 'Ensign',
    });

    await whois.execute(interaction);

    const embed = interaction.editReply.mock.calls[0][0].embeds[0].toJSON();
    expect(embed.fields).toEqual(expect.arrayContaining([
      { name: 'Organization', value: 'None listed', inline: true },
      { name: 'SID', value: 'ORG123', inline: true },
      { name: 'Rank', value: 'Ensign', inline: true },
    ]));
  });

  it('handles missing SID gracefully', async () => {
    const interaction = mockInteraction();
    VerifiedUser.findByPk.mockResolvedValue({ rsiHandle: 'TestHandle' });

    fetchRsiProfileInfo.mockResolvedValue({
      handle: 'TestHandle',
      avatar: 'https://cdn.test/avatar.png',
      bio: 'Test bio',
      enlisted: 'Jan 1, 2020',
      orgName: 'Test Org',
      orgId: null,
      orgRank: 'Ensign',
    });

    await whois.execute(interaction);

    const embed = interaction.editReply.mock.calls[0][0].embeds[0].toJSON();
    expect(embed.fields).toEqual(expect.arrayContaining([
      { name: 'Organization', value: 'Test Org', inline: true },
      { name: 'SID', value: 'Not listed', inline: true },
      { name: 'Rank', value: 'Ensign', inline: true },
    ]));
  });

  it('handles missing Organization rank gracefully', async () => {
    const interaction = mockInteraction();
    VerifiedUser.findByPk.mockResolvedValue({ rsiHandle: 'TestHandle' });

    fetchRsiProfileInfo.mockResolvedValue({
      handle: 'TestHandle',
      avatar: 'https://cdn.test/avatar.png',
      bio: 'Test bio',
      enlisted: 'Jan 1, 2020',
      orgName: 'Test Org',
      orgId: 'ORG123',
      orgRank: null,
    });

    await whois.execute(interaction);

    const embed = interaction.editReply.mock.calls[0][0].embeds[0].toJSON();
    expect(embed.fields).toEqual(expect.arrayContaining([
      { name: 'Organization', value: 'Test Org', inline: true },
      { name: 'SID', value: 'ORG123', inline: true },
      { name: 'Rank', value: 'Not listed', inline: true },
    ]));
  });

  it('handles missing Enlisted date gracefully', async () => {
    const interaction = mockInteraction();
    VerifiedUser.findByPk.mockResolvedValue({ rsiHandle: 'TestHandle' });

    fetchRsiProfileInfo.mockResolvedValue({
      handle: 'TestHandle',
      avatar: 'https://cdn.test/avatar.png',
      bio: 'Test bio',
      enlisted: '',
      orgName: 'Test Org',
      orgId: 'ORG123',
      orgRank: 'Captain',
    });

    await whois.execute(interaction);

    const embed = interaction.editReply.mock.calls[0][0].embeds[0].toJSON();
    expect(embed.fields).toEqual(expect.arrayContaining([
      { name: 'Enlisted', value: 'Not listed', inline: true },
    ]));
  });

  it('handles missing Bio gracefully', async () => {
    const interaction = mockInteraction();
    VerifiedUser.findByPk.mockResolvedValue({ rsiHandle: 'TestHandle' });

    fetchRsiProfileInfo.mockResolvedValue({
      handle: 'TestHandle',
      avatar: 'https://cdn.test/avatar.png',
      bio: '',
      enlisted: 'Jan 1, 2020',
      orgName: 'Test Org',
      orgId: 'ORG123',
      orgRank: 'Ensign',
    });

    await whois.execute(interaction);

    const embed = interaction.editReply.mock.calls[0][0].embeds[0].toJSON();
    expect(embed.description).toBe('No bio provided.');
  });

});
