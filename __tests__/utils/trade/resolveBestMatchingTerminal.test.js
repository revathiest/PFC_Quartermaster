const { resolveBestMatchingTerminal } = require('../../../utils/trade/resolveBestMatchingTerminal');

describe('resolveBestMatchingTerminal', () => {
  const terminals = [
    {
      code: 'ARC',
      nickname: 'Area Arc',
      name: 'Best ArcCorp Terminal',
      city_name: 'Area18'
    },
    {
      code: 'XYZ',
      nickname: 'Xyzzy',
      name: 'Xyzzy Terminal',
      city_name: 'Lorville'
    }
  ];

  test('exact code match outranks partial name match', () => {
    const match = resolveBestMatchingTerminal('ARC', terminals);
    expect(match).toBe(terminals[0]);
  });

  test('prefix match outranks contained substring', () => {
    const local = [
      { code: 'PO1', name: 'Port Olisar' },
      { code: 'AP1', name: 'Alpha Port' }
    ];
    const match = resolveBestMatchingTerminal('Port', local);
    expect(match).toBe(local[0]);
  });

  test('returns null when no match found', () => {
    const match = resolveBestMatchingTerminal('UnknownPlace', terminals);
    expect(match).toBeNull();
  });
});
