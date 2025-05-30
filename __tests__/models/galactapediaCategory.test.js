const defineModel = require('../../models/galactapediaCategory');

describe('GalactapediaCategory model', () => {
  test('defines fields and charset options', () => {
    const define = jest.fn(() => ({}));
    const sequelize = { define };
    const model = defineModel(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];

    expect(name).toBe('GalactapediaCategory');
    expect(attrs).toHaveProperty('entry_id');
    expect(attrs).toHaveProperty('category_id');
    expect(opts.charset).toBe('utf8mb4');
    expect(opts.collate).toBe('utf8mb4_unicode_ci');
    expect(model).toEqual({});
  });
});
