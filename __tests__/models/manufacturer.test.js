const defineModel = require('../../models/manufacturer');

describe('Manufacturer model definition', () => {
  test('defines fields and options correctly', () => {
    const define = jest.fn(() => ({}));
    const sequelize = { define };
    const model = defineModel(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];

    expect(name).toBe('Manufacturer');
    expect(attrs).toHaveProperty('code');
    expect(attrs.code.primaryKey).toBe(true);
    expect(attrs).toHaveProperty('name');
    expect(attrs).toHaveProperty('link');
    expect(opts.tableName).toBe('Manufacturers');
    expect(opts.timestamps).toBe(false);
    expect(model).toEqual({});
  });
});
