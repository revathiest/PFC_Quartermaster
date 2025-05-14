jest.mock('discord.js');
jest.mock('../../../../utils/trade/tradeCalculations');
jest.mock('../../../../utils/trade/tradeComponents');
jest.mock('../../../../utils/trade/tradeEmbeds');
jest.mock('../../../../utils/trade/tradeQueries', () => ({
    getBuyOptionsAtLocation: jest.fn(),
    getSellPricesForCommodityElsewhere: jest.fn(),
    getVehicleByName: jest.fn()
  }));

const { handleTradeBest } = require('../../../../utils/trade/handlers/best');
const { MockInteraction, MessageFlags } = require('discord.js');

const {
  getVehicleByName,
  getBuyOptionsAtLocation,
  getSellPricesForCommodityElsewhere
} = require('../../../../utils/trade/tradeQueries');

const { calculateProfitOptions } = require('../../../../utils/trade/tradeCalculations');
const { buildBestTradesEmbed } = require('../../../../utils/trade/tradeEmbeds');
const { buildShipSelectMenu } = require('../../../../utils/trade/tradeComponents');
const { safeReply, TradeStateCache } = require('../../../../utils/trade/handlers/shared');

describe('handleTradeBest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('responds with embed if profitable options exist', async () => {
    const interaction = new MockInteraction({
      options: { from: 'Port Olisar' },
      user: { id: 'mock-user-id' }
    });

    getVehicleByName.mockResolvedValue([{ name: 'Cutlass Black', scu: 46 }]);
    getBuyOptionsAtLocation.mockResolvedValue([
      { commodity_name: 'Laranite', price_buy: 10, scu_buy: 100, terminal: { name: 'T1' } }
    ]);
    getSellPricesForCommodityElsewhere.mockResolvedValue([
      { price_sell: 15, terminal: { name: 'T2', city_name: 'Area18' } }
    ]);
    calculateProfitOptions.mockReturnValue([
      { commodity: 'Laranite', profitPerSCU: 5, totalProfit: 500, cargoUsed: 100 }
    ]);
    buildBestTradesEmbed.mockReturnValue({ title: 'Mock Embed' });

    await handleTradeBest(interaction, {}, {
      fromLocation: 'Port Olisar',
      shipQuery: 'Cutlass Black',
      cash: 100000
    });

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      embeds: [{ title: 'Mock Embed' }]
    });
  });

  test('responds with error if no profitable trades found', async () => {
    const interaction = new MockInteraction({
      options: { from: 'Port Olisar' },
      user: { id: 'mock-user-id' }
    });

    getVehicleByName.mockResolvedValue([{ name: 'Cutlass Black', scu: 46 }]);
    getBuyOptionsAtLocation.mockResolvedValue([
      { commodity_name: 'Titanium', price_buy: 10, scu_buy: 10, terminal: { name: 'T1' } }
    ]);
    getSellPricesForCommodityElsewhere.mockResolvedValue([
      { price_sell: 10, terminal: { name: 'T2', city_name: 'Area18' } }
    ]);
    calculateProfitOptions.mockReturnValue([]); // No profit

    await handleTradeBest(interaction, {}, {
      fromLocation: 'Port Olisar',
      shipQuery: 'Cutlass Black',
      cash: 50000
    });

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      content: '❌ No profitable trades found from **Port Olisar**.',
      flags: MessageFlags.Ephemeral
    });
  });

  test('responds with error if no ships match shipQuery', async () => {
    const interaction = new MockInteraction({
      options: { from: 'Port Olisar' },
      user: { id: 'mock-user-id' }
    });

    getVehicleByName.mockResolvedValue([]);

    await handleTradeBest(interaction, {}, {
      fromLocation: 'Port Olisar',
      shipQuery: 'Caterpiggle',
      cash: 50000
    });

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      content: '❌ No ships found matching **Caterpiggle**.',
      flags: MessageFlags.Ephemeral
    });
  });

  test('responds with select menu if multiple ships match shipQuery', async () => {
    const interaction = new MockInteraction({
      options: { from: 'Port Olisar' },
      user: { id: 'mock-user-id' }
    });

    const matchedShips = [
      { name: 'Cutlass Black', scu: 46 },
      { name: 'Cutlass Red', scu: 46 }
    ];
    getVehicleByName.mockResolvedValue(matchedShips);
    buildShipSelectMenu.mockReturnValue({ type: 1, components: [] });

    await handleTradeBest(interaction, {}, {
      fromLocation: 'Port Olisar',
      shipQuery: 'Cutlass',
      cash: 50000
    });

    expect(TradeStateCache.set).toHaveBeenCalledWith('mock-user-id', {
      fromLocation: 'Port Olisar',
      shipQuery: 'Cutlass',
      cash: 50000
    });

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      content: 'Multiple ships matched **Cutlass**. Please select one:',
      components: [{ type: 1, components: [] }],
      flags: MessageFlags.Ephemeral
    });
  });

  test('clears TradeStateCache if a single ship is selected', async () => {
    const interaction = new MockInteraction({
      options: { from: 'Port Olisar' },
      user: { id: 'mock-user-id' }
    });

    getVehicleByName.mockResolvedValue([{ name: 'Cutlass Black', scu: 46 }]);
    getBuyOptionsAtLocation.mockResolvedValue([]);
    getSellPricesForCommodityElsewhere.mockResolvedValue([]);
    calculateProfitOptions.mockReturnValue([]);

    await handleTradeBest(interaction, {}, {
      fromLocation: 'Port Olisar',
      shipQuery: 'Cutlass Black',
      cash: 50000
    });

    expect(TradeStateCache.delete).toHaveBeenCalledWith('mock-user-id');
  });

  test('responds with generic error if an exception is thrown', async () => {
    const interaction = new MockInteraction({
      options: { from: 'Port Olisar' },
      user: { id: 'mock-user-id' }
    });

    getVehicleByName.mockRejectedValue(new Error('Boom'));

    await handleTradeBest(interaction, {}, {
      fromLocation: 'Port Olisar',
      shipQuery: 'Explodo Ship',
      cash: 50000
    });

    expect(safeReply).toHaveBeenCalledWith(interaction, {
      content: '⚠️ An error occurred processing your request.',
      flags: MessageFlags.Ephemeral
    });
  });
});
