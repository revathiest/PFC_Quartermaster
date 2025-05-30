jest.mock('../../../botactions/scheduling/scheduleHandler', () => ({
  saveAnnouncementToDatabase: jest.fn()
}));

const { pendingChannelSelection } = require('../../../utils/pendingSelections');
const { saveAnnouncementToDatabase } = require('../../../botactions/scheduling/scheduleHandler');
const { execute, option } = require('../../../commands/admin/schedule');
const { MessageFlags } = require('discord.js');

const makeInteraction = () => ({
  showModal: jest.fn(),
  values: ['channel1'],
  guild: { id: 'guild1' },
  reply: jest.fn(),
  user: { id: 'user1' }
});

beforeEach(() => {
  jest.clearAllMocks();
  for (const k of Object.keys(pendingChannelSelection)) delete pendingChannelSelection[k];
});


describe('/schedule option handler', () => {
  test('rejects when no pending announcement', async () => {
    const interaction = makeInteraction();
    await option(interaction, {});
    expect(interaction.reply).toHaveBeenCalledWith({ content: expect.stringContaining('No pending'), flags: MessageFlags.Ephemeral });
  });

  test('saves announcement and clears pending', async () => {
    const interaction = makeInteraction();
    pendingChannelSelection['user1'] = { title: 't', description: 'd', author: 'a', time: 'now' };
    interaction.user = { id: 'user1' };
    await option(interaction, {});
    expect(saveAnnouncementToDatabase).toHaveBeenCalledWith('channel1', 'guild1', expect.any(Object), 'now', {});
    expect(pendingChannelSelection['user1']).toBeUndefined();
    expect(interaction.reply).toHaveBeenCalledWith({ content: expect.stringContaining('successfully'), flags: MessageFlags.Ephemeral });
  });
});
