const defineModel = require('../../models/orgTag');

describe('OrgTag model definition', () => {
  test('defines fields and options correctly', () => {
    const define = jest.fn(() => ({}));
    const sequelize = { define };
    const model = defineModel(sequelize);
    const [name, attrs, opts] = define.mock.calls[0];

    expect(name).toBe('OrgTag');
    expect(attrs).toHaveProperty('rsiOrgId');
    expect(attrs.rsiOrgId.primaryKey).toBe(true);
    expect(attrs).toHaveProperty('tag');
    expect(opts.tableName).toBe('org_tags');
    expect(opts.charset).toBe('utf8mb4');
    expect(opts.collate).toBe('utf8mb4_unicode_ci');
    expect(model).toEqual({});
  });
});
