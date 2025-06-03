const defineModel = require('../../models/hunt');

describe('Hunt model', () => {
  test('defines fields and options', () => {
    const define = jest.fn(() => ({}));
    const sequelize = { define };
    const model = defineModel(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];

    expect(name).toBe('Hunt');
    expect(attrs).toHaveProperty('id');
    expect(attrs).toHaveProperty('name');
    expect(attrs).toHaveProperty('starts_at');
    expect(opts.tableName).toBe('hunts');
    expect(model).toEqual({});
  });
});
