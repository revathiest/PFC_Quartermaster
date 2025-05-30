const defineModel = require('../../models/accolade');

describe('Accolade model', () => {
  test('defines fields and options correctly', () => {
    const define = jest.fn(() => ({}));
    const sequelize = { define };
    const model = defineModel(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];

    expect(name).toBe('Accolade');
    expect(attrs).toHaveProperty('role_id');
    expect(attrs).toHaveProperty('emoji');
    expect(opts.tableName).toBe('Accolades');
    expect(model).toEqual({});
  });
});
