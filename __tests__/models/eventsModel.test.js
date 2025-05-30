const defineModel = require('../../models/eventsModel');

describe('Event model', () => {
  test('defines fields and table name', () => {
    const define = jest.fn(() => ({}));
    const sequelize = { define };
    const model = defineModel(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];

    expect(name).toBe('Event');
    expect(attrs).toHaveProperty('event_id');
    expect(attrs).toHaveProperty('name');
    expect(attrs).toHaveProperty('start_time');
    expect(opts.tableName).toBe('Events');
    expect(model).toEqual({});
  });
});
