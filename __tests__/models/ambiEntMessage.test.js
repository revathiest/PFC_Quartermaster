const defineModel = require('../../models/ambiEntMessage');

describe('AmbientMessage model', () => {
  test('defines fields and options correctly', () => {
    const define = jest.fn(() => ({}));
    const sequelize = { define };
    const model = defineModel(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];

    expect(name).toBe('AmbientMessage');
    expect(attrs).toHaveProperty('content');
    expect(attrs).toHaveProperty('tag');
    expect(opts.tableName).toBe('ambient_messages');
    expect(opts.timestamps).toBe(true);
    expect(model).toEqual({});
  });
});
