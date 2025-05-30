const defineModel = require('../../models/ambientSetting');

describe('AmbientSetting model', () => {
  test('defines fields and options', () => {
    const define = jest.fn(() => ({}));
    const sequelize = { define };
    const model = defineModel(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];

    expect(name).toBe('AmbientSetting');
    expect(attrs).toHaveProperty('guildId');
    expect(attrs).toHaveProperty('minMessagesSinceLast');
    expect(opts.tableName).toBe('ambient_settings');
    expect(opts.timestamps).toBe(false);
    expect(model).toEqual({});
  });
});
