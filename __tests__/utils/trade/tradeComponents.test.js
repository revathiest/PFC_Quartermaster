const { buildShipSelectMenu } = require('../../../utils/trade/tradeComponents');
const { StringSelectMenuBuilder } = require('discord.js');

// Silence console warnings during tests
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  console.warn.mockRestore();
});

describe('buildShipSelectMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates menu options for given vehicles', () => {
    const vehicles = [
      { id: 1, name: 'Cutlass', name_full: 'Drake Cutlass', company_name: 'Drake', scu: 46 },
      { id: 2, name: 'Freelancer', company_name: 'MISC', scu: 66 }
    ];

    const row = buildShipSelectMenu(vehicles);

    const menu = StringSelectMenuBuilder.mock.instances[0];
    expect(row).toBeDefined();
    expect(menu.data.options).toHaveLength(2);
    expect(menu.data.options[0]).toMatchObject({
      label: 'Drake Cutlass',
      description: 'Drake (46 SCU)',
      value: '1'
    });
    expect(menu.data.options[1]).toMatchObject({
      label: 'Freelancer',
      description: 'MISC (66 SCU)',
      value: '2'
    });
  });

  test('limits options to 25 entries', () => {
    const vehicles = Array.from({ length: 30 }, (_, i) => ({ id: i, name: `Ship${i}`, scu: i }));
    buildShipSelectMenu(vehicles);
    const menu = StringSelectMenuBuilder.mock.instances[0];
    expect(menu.data.options).toHaveLength(25);
  });

  test('returns null and warns when vehicle list empty', () => {
    const result = buildShipSelectMenu([]);
    expect(console.warn).toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
