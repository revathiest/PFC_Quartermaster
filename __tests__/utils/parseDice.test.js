const parseDice = require('../../utils/parseDice');

describe('parseDice', () => {
  test('parses a typical formula 2d6+1', () => {
    const result = parseDice('2d6+1');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('rolls');
    expect(typeof result.total).toBe('number');
    expect(Array.isArray(result.rolls)).toBe(true);
    expect(result.rolls.length).toBe(2);
  });

  test('throws on invalid formula string', () => {
    expect(() => parseDice('bad')).toThrow('Invalid dice format');
  });

  test('throws when exceeding limits', () => {
    expect(() => parseDice('101d6')).toThrow('Too many dice or sides');
    expect(() => parseDice('1d1001')).toThrow('Too many dice or sides');
  });
});
