const defineModel = require('../../models/galactapediaProperty');

describe('GalactapediaProperty model definition', () => {
  test('defines fields and options correctly', () => {
    const define = jest.fn(() => ({}));
    const sequelize = { define };
    const model = defineModel(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];

    expect(name).toBe('GalactapediaProperty');
    expect(attrs).toHaveProperty('entry_id');
    expect(attrs).toHaveProperty('name');
    expect(attrs).toHaveProperty('value');
    expect(opts.indexes[0].fields).toEqual(['entry_id']);
    expect(opts.charset).toBe('utf8mb4');
    expect(opts.collate).toBe('utf8mb4_unicode_ci');
    expect(model).toEqual({});
  });
});
