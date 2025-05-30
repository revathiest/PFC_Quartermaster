const defineModel = require('../../models/snapChannels');

describe('SnapChannel model definition', () => {
  test('defines fields and options correctly', () => {
    const define = jest.fn(() => ({}));
    const sequelize = { define };
    const model = defineModel(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];

    expect(name).toBe('SnapChannel');
    expect(attrs).toHaveProperty('id');
    expect(attrs.id.autoIncrement).toBe(true);
    expect(attrs).toHaveProperty('channelId');
    expect(attrs.channelId.unique).toBe(true);
    expect(attrs).toHaveProperty('purgeTimeInDays');
    expect(attrs).toHaveProperty('serverId');
    expect(attrs).toHaveProperty('lastPurgeDate');
    expect(opts.tableName).toBe('SnapChannels');
    expect(opts.timestamps).toBe(true);
    expect(model).toEqual({});
  });
});
