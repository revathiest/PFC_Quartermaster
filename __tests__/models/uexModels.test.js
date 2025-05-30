const defineFuelPrice = require('../../models/uexFuelPrice');
const defineItemPrice = require('../../models/uexItemPrice');
const definePoi = require('../../models/uexPoi');
const defineTerminal = require('../../models/uexTerminal');
const defineVehicle = require('../../models/uexVehicle');
const definePurchasePrice = require('../../models/uexVehiclePurchasePrice');
const defineRentalPrice = require('../../models/uexVehicleRentalPrice');

describe('UEX related model definitions', () => {
  test('UexFuelPrice model definition', () => {
    const modelObj = {};
    const define = jest.fn(() => modelObj);
    const sequelize = { define };
    const model = defineFuelPrice(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];
    expect(name).toBe('UexFuelPrice');
    expect(attrs).toHaveProperty('price_buy');
    expect(opts.tableName).toBe('UexFuelPrices');
    expect(opts.timestamps).toBe(false);
    expect(model).toBe(modelObj);
  });

  test('UexItemPrice model definition and association', () => {
    const modelObj = { belongsTo: jest.fn() };
    const define = jest.fn(() => modelObj);
    const sequelize = { define };
    const model = defineItemPrice(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];
    expect(name).toBe('UexItemPrice');
    expect(attrs).toHaveProperty('id_item');
    expect(opts.tableName).toBe('UexItemPrices');
    expect(model).toBe(modelObj);
    expect(typeof model.associate).toBe('function');

    const terminalModel = {};
    model.associate({ UexTerminal: terminalModel });
    expect(model.belongsTo).toHaveBeenCalledWith(terminalModel, {
      foreignKey: 'id_terminal',
      as: 'terminal'
    });
  });

  test('UexPoi model definition', () => {
    const modelObj = {};
    const define = jest.fn(() => modelObj);
    const sequelize = { define };
    const model = definePoi(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];
    expect(name).toBe('UexPoi');
    expect(attrs).toHaveProperty('name');
    expect(opts.tableName).toBe('UexPois');
    expect(typeof model.associate).toBe('function');
  });

  test('UexTerminal model definition and association', () => {
    const modelObj = { belongsTo: jest.fn() };
    const define = jest.fn(() => modelObj);
    const sequelize = { define };
    const model = defineTerminal(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];
    expect(name).toBe('UexTerminal');
    expect(attrs).toHaveProperty('id');
    expect(opts.charset).toBe('utf8mb4');
    expect(model).toBe(modelObj);
    model.associate({ UexPoi: 'poiModel' });
    expect(model.belongsTo).toHaveBeenCalledWith('poiModel', {
      foreignKey: 'id_poi',
      as: 'poi'
    });
  });

  test('UexVehicle model definition', () => {
    const modelObj = {};
    const define = jest.fn(() => modelObj);
    const sequelize = { define };
    const model = defineVehicle(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];
    expect(name).toBe('UexVehicle');
    expect(attrs).toHaveProperty('uuid');
    expect(opts.tableName).toBe('UexVehicles');
    expect(model).toBe(modelObj);
  });

  test('UexVehiclePurchasePrice model definition and association', () => {
    const modelObj = { belongsTo: jest.fn() };
    const define = jest.fn(() => modelObj);
    const sequelize = { define };
    const model = definePurchasePrice(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];
    expect(name).toBe('UexVehiclePurchasePrice');
    expect(attrs).toHaveProperty('price_buy');
    expect(opts.tableName).toBe('UexVehiclePurchasePrices');
    expect(model).toBe(modelObj);
    model.associate({ UexTerminal: 'terminalModel' });
    expect(model.belongsTo).toHaveBeenCalledWith('terminalModel', {
      foreignKey: 'id_terminal',
      as: 'terminal'
    });
  });

  test('UexVehicleRentalPrice model definition', () => {
    const modelObj = {};
    const define = jest.fn(() => modelObj);
    const sequelize = { define };
    const model = defineRentalPrice(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];
    expect(name).toBe('UexVehicleRentalPrice');
    expect(attrs).toHaveProperty('price_rent');
    expect(opts.tableName).toBe('UexVehicleRentalPrices');
    expect(model).toBe(modelObj);
  });
});
