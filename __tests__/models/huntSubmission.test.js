const defineModel = require('../../models/huntSubmission');

describe('HuntSubmission model', () => {
  test('defines fields and options', () => {
    const define = jest.fn(() => ({}));
    const sequelize = { define };
    const model = defineModel(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];

    expect(name).toBe('HuntSubmission');
    expect(attrs).toHaveProperty('id');
    expect(attrs).toHaveProperty('hunt_id');
    expect(attrs).toHaveProperty('poi_id');
    expect(attrs).toHaveProperty('status');
    expect(opts.tableName).toBe('hunt_submissions');
    expect(model).toEqual({});
  });
});
