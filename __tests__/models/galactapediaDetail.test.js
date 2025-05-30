const defineModel = require('../../models/galactapediaDetail');

describe('GalactapediaDetail model definition', () => {
  test('defines fields and options correctly', () => {
    const define = jest.fn(() => ({}));
    const sequelize = { define };
    const model = defineModel(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];

    expect(name).toBe('GalactapediaDetail');
    expect(attrs).toHaveProperty('entry_id');
    expect(attrs.entry_id.primaryKey).toBe(true);
    expect(attrs).toHaveProperty('content');
    expect(attrs).toHaveProperty('created_at');
    expect(attrs).toHaveProperty('updated_at');
    expect(opts.charset).toBe('utf8mb4');
    expect(opts.collate).toBe('utf8mb4_unicode_ci');
    expect(model).toEqual({});
  });
});
