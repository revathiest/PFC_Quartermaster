const defineModel = require('../../models/huntPoi');

describe('HuntPoi model', () => {
  test('defines fields and options', () => {
    const define = jest.fn(() => ({}));
    const sequelize = { define };
    const model = defineModel(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];

    expect(name).toBe('HuntPoi');
    expect(attrs).toHaveProperty('id');
    expect(attrs).toHaveProperty('name');
    expect(attrs).toHaveProperty('hint');
    expect(attrs).toHaveProperty('points');
    expect(opts.tableName).toBe('hunt_pois');
    expect(model).toEqual({});
  });
});
