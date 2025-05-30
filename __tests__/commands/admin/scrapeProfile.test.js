jest.mock('../../../utils/rsiProfileScraper');
const { fetchRsiProfileInfo } = require('../../../utils/rsiProfileScraper');
const { execute } = require('../../../commands/admin/scrapeProfile');
const { MessageFlags } = require('discord.js');

const makeInteraction = () => ({
  options: { getString: jest.fn(() => 'Handle') },
  reply: jest.fn()
});

beforeEach(() => jest.clearAllMocks());

describe('/scrape-profile command', () => {
  test('replies with profile embed', async () => {
    const interaction = makeInteraction();
    fetchRsiProfileInfo.mockResolvedValue({ handle: 'Handle', bio: 'b', enlisted: 'e', avatar: 'a', orgRank: 'r', orgName: 'n', orgId: 'id' });

    await execute(interaction);

    expect(fetchRsiProfileInfo).toHaveBeenCalledWith('Handle');
    expect(interaction.reply).toHaveBeenCalledWith({ embeds: [expect.any(Object)], flags: MessageFlags.Ephemeral });
  });

  test('handles errors', async () => {
    const interaction = makeInteraction();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    fetchRsiProfileInfo.mockRejectedValue(new Error('fail'));

    await execute(interaction);

    expect(spy).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Failed to fetch profile'), flags: MessageFlags.Ephemeral }));
    spy.mockRestore();
  });
});
