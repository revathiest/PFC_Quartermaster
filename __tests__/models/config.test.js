const defineConfig = require('../../models/config');

describe('Config model definition', () => {
  test('defines fields and options correctly', () => {
    const define = jest.fn(() => ({}));
    const sequelize = { define };
    const model = defineConfig(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];

    expect(name).toBe('Config');
    expect(attrs).toHaveProperty('key');
    expect(attrs).toHaveProperty('value');
    expect(attrs).toHaveProperty('botType');
    expect(opts.tableName).toBe('Configs');
    expect(opts.uniqueKeys.unique_key.fields).toEqual(['key', 'botType']);
    expect(model).toEqual({});
  });
});
