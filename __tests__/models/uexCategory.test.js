const defineModel = require('../../models/uexCategory');

describe('UexCategory model definition', () => {
  test('defines fields and options correctly', () => {
    const define = jest.fn(() => ({}));
    const sequelize = { define };
    const model = defineModel(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];

    expect(name).toBe('UexCategory');
    expect(attrs).toHaveProperty('id');
    expect(attrs.id.primaryKey).toBe(true);
    expect(attrs).toHaveProperty('type');
    expect(attrs).toHaveProperty('section');
    expect(attrs).toHaveProperty('name');
    expect(attrs).toHaveProperty('is_game_related');
    expect(attrs).toHaveProperty('is_mining');
    expect(attrs).toHaveProperty('date_added');
    expect(attrs).toHaveProperty('date_modified');
    expect(opts.tableName).toBe('UexCategories');
    expect(opts.charset).toBe('utf8mb4');
    expect(opts.collate).toBe('utf8mb4_unicode_ci');
    expect(opts.timestamps).toBe(false);
    expect(model).toEqual({});
  });
});
