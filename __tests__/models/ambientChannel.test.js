const defineModel = require('../../models/ambientChannel');

describe('AmbientChannel model', () => {
  test('defines fields and unique index', () => {
    const define = jest.fn(() => ({}));
    const sequelize = { define };
    const model = defineModel(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];

    expect(name).toBe('AmbientChannel');
    expect(attrs).toHaveProperty('guildId');
    expect(attrs).toHaveProperty('channelId');
    expect(opts.tableName).toBe('ambient_channels');
    expect(opts.indexes[0].unique).toBe(true);
    expect(model).toEqual({});
  });
});
