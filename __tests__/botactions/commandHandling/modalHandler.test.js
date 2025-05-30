jest.mock('../../../botactions/scheduling/scheduleHandler', () => ({
  saveAnnouncementToDatabase: jest.fn()
}));

const { MessageFlags } = require('../../../__mocks__/discord.js');
const { saveAnnouncementToDatabase } = require('../../../botactions/scheduling/scheduleHandler');
const handler = require('../../../botactions/commandHandling/modalHandler');

describe('modalHandler', () => {
  test('ignores non modal submit', async () => {
    const interaction = { isModalSubmit: () => false };
    await handler.execute(interaction);
    expect(saveAnnouncementToDatabase).not.toHaveBeenCalled();
  });

  test('rejects invalid time', async () => {
    const reply = jest.fn();
    const interaction = {
      isModalSubmit: () => true,
      customId: 'scheduleModal',
      fields: { getTextInputValue: jest.fn((id) => ({
        channel: 'c1', title: 't', description: 'd', color: '', author: '', footer: '', time: 'bad'
      })[id]) },
      reply
    };
    await handler.execute(interaction);
    expect(reply).toHaveBeenCalledWith({ content: 'Invalid time format. Please use YYYY-MM-DD HH:mm:ss', flags: MessageFlags.Ephemeral });
    expect(saveAnnouncementToDatabase).not.toHaveBeenCalled();
  });

  test('saves announcement on valid input', async () => {
    const reply = jest.fn();
    const interaction = {
      isModalSubmit: () => true,
      customId: 'scheduleModal',
      fields: { getTextInputValue: jest.fn((id) => ({
        channel: 'c1',
        title: 't',
        description: 'd',
        color: '#fff',
        author: 'a',
        footer: 'f',
        time: '2023-01-01 10:00:00'
      })[id]) },
      reply
    };
    await handler.execute(interaction);
    expect(saveAnnouncementToDatabase).toHaveBeenCalledWith('c1', { title: 't', description: 'd', color: '#fff', author: 'a', footer: 'f' }, '2023-01-01 10:00:00');
    expect(reply).toHaveBeenCalledWith({ content: 'Announcement scheduled for 2023-01-01 10:00:00 in channel c1', flags: MessageFlags.Ephemeral });
  });
});
