const defineModel = require('../../models/uexCommodityPrice');

describe('UexCommodityPrice model definition', () => {
  test('defines fields, options, and association correctly', () => {
    const define = jest.fn(() => ({}));
    const belongsTo = jest.fn();
    const sequelize = { define };
    const models = { UexTerminal: {} };

    const model = defineModel(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];

    expect(name).toBe('UexCommodityPrice');
    expect(attrs).toHaveProperty('id');
    expect(attrs.id.primaryKey).toBe(true);
    expect(attrs).toHaveProperty('id_commodity');
    expect(attrs).toHaveProperty('id_terminal');
    expect(opts.tableName).toBe('UexCommodityPrices');
    expect(opts.charset).toBe('utf8mb4');
    expect(opts.collate).toBe('utf8mb4_unicode_ci');
    expect(opts.timestamps).toBe(false);
    expect(typeof model.associate).toBe('function');

    // test association method
    model.belongsTo = belongsTo; // in case define returned object, we patch
    model.associate(models);
    expect(belongsTo).toHaveBeenCalledWith(models.UexTerminal, {
      foreignKey: 'id_terminal',
      as: 'terminal'
    });
  });
});
