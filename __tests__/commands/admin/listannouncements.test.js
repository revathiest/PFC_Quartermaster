jest.mock('../../../botactions/scheduling/scheduleHandler', () => ({
  getScheduledAnnouncements: jest.fn()
}));

const { getScheduledAnnouncements } = require('../../../botactions/scheduling/scheduleHandler');
const { MessageFlags } = require('discord.js');
const { execute } = require('../../../commands/admin/listannouncements');

function createInteraction(hasPerm = true) {
  return {
    member: {
      permissions: { has: jest.fn(() => hasPerm) }
    },
    reply: jest.fn()
  };
}

describe('/listannouncements command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('blocks users without required role', async () => {
    const interaction = createInteraction(false);
    await execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: 'You do not have permission to use this command.',
      flags: MessageFlags.Ephemeral
    });
  });

  test('informs when no announcements', async () => {
    const interaction = createInteraction(true);
    getScheduledAnnouncements.mockResolvedValue([]);
    await execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith('There are no scheduled announcements.');
  });

  test('lists announcements when present', async () => {
    const interaction = createInteraction(true);
    getScheduledAnnouncements.mockResolvedValue([
      { id: 1, embedData: JSON.stringify({ title: 'Hello' }), time: 't' }
    ]);
    await execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining('ID: 1'));
  });
});
