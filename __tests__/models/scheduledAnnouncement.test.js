const defineModel = require('../../models/scheduledAnnouncement');

describe('ScheduledAnnouncement model definition', () => {
  test('defines fields correctly', () => {
    const define = jest.fn(() => ({}));
    const sequelize = { define };
    const model = defineModel(sequelize);
    const [name, attrs] = define.mock.calls[0];

    expect(name).toBe('ScheduledAnnouncement');
    expect(attrs).toHaveProperty('channelId');
    expect(attrs).toHaveProperty('guildId');
    expect(attrs).toHaveProperty('embedData');
    expect(attrs).toHaveProperty('time');
    expect(model).toEqual({});
  });
});
