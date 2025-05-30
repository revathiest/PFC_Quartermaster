const defineUsageLog = require('../../models/usageLog');
const defineVehicle = require('../../models/vehicle');
const defineVehicleDetail = require('../../models/vehicleDetail');
const defineVerificationCode = require('../../models/verificationCode');
const defineVerifiedUser = require('../../models/verifiedUser');

describe('Misc model definitions', () => {
  test('UsageLog model definition', () => {
    const modelObj = {};
    const define = jest.fn(() => modelObj);
    const sequelize = { define };
    const model = defineUsageLog(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];
    expect(name).toBe('UsageLog');
    expect(attrs).toHaveProperty('user_id');
    expect(opts.charset).toBe('utf8mb4');
    expect(model).toBe(modelObj);
  });

  test('Vehicle model definition', () => {
    const modelObj = {};
    const define = jest.fn(() => modelObj);
    const sequelize = { define };
    const model = defineVehicle(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];
    expect(name).toBe('Vehicle');
    expect(attrs).toHaveProperty('uuid');
    expect(opts.charset).toBe('utf8mb4');
    expect(model).toBe(modelObj);
  });

  test('VehicleDetail model definition', () => {
    const modelObj = {};
    const define = jest.fn(() => modelObj);
    const sequelize = { define };
    const model = defineVehicleDetail(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];
    expect(name).toBe('VehicleDetail');
    expect(attrs).toHaveProperty('uuid');
    expect(opts.charset).toBe('utf8mb4');
    expect(model).toBe(modelObj);
  });

  test('VerificationCode model definition', () => {
    const modelObj = {};
    const define = jest.fn(() => modelObj);
    const sequelize = { define };
    const model = defineVerificationCode(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];
    expect(name).toBe('VerificationCode');
    expect(attrs).toHaveProperty('discordUserId');
    expect(opts.tableName).toBe('verification_codes');
    expect(model).toBe(modelObj);
  });

  test('VerifiedUser model definition', () => {
    const modelObj = {};
    const define = jest.fn(() => modelObj);
    const sequelize = { define };
    const model = defineVerifiedUser(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];
    expect(name).toBe('VerifiedUser');
    expect(attrs).toHaveProperty('discordUserId');
    expect(opts.tableName).toBe('verified_users');
    expect(model).toBe(modelObj);
  });
});
