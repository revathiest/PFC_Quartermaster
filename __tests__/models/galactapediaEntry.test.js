const defineModel = require('../../models/galactapediaEntry');

describe('GalactapediaEntry model definition', () => {
  test('defines fields and options correctly', () => {
    const define = jest.fn(() => ({}));
    const sequelize = { define };
    const model = defineModel(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];
    expect(name).toBe('GalactapediaEntry');
    expect(attrs).toHaveProperty('id');
    expect(attrs).toHaveProperty('title');
    expect(opts.charset).toBe('utf8mb4');
    expect(opts.collate).toBe('utf8mb4_unicode_ci');
    expect(model).toEqual({});
  });
});
