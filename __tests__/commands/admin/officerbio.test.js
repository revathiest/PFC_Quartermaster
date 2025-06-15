const { execute } = require('../../../commands/admin/officerbio');
const { OfficerBio } = require('../../../config/database');
const { MessageFlags } = require('discord.js');

jest.mock('../../../config/database', () => ({ OfficerBio: { upsert: jest.fn() } }));

describe('/officerbio command', () => {
  const makeInteraction = () => ({
    options: { getString: jest.fn(() => 'new bio') },
    user: { id: 'u1' },
    reply: jest.fn()
  });

  beforeEach(() => jest.clearAllMocks());

  test('saves bio for officer', async () => {
    const interaction = makeInteraction();
    await execute(interaction);
    expect(OfficerBio.upsert).toHaveBeenCalledWith({ discordUserId: 'u1', bio: 'new bio' });
    expect(interaction.reply).toHaveBeenCalledWith({ content: '✅ Bio saved.', flags: MessageFlags.Ephemeral });
  });

  test('handles errors gracefully', async () => {
    const interaction = makeInteraction();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    OfficerBio.upsert.mockRejectedValue(new Error('fail'));
    await execute(interaction);
    expect(spy).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ Error saving bio.', flags: MessageFlags.Ephemeral });
    spy.mockRestore();
  });
});
