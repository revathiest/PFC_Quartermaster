jest.mock('../../../utils/trade/tradeQueries');
jest.mock('../../../utils/trade/tradeCalculations');
jest.mock('../../../utils/trade/tradeEmbeds');

const {
  getSellOptionsAtLocation,
  getCommodityTradeOptions,
  getVehicleByName,
  getAllShipNames,
  getReturnOptions,
  getTerminalsAtLocation
} = require('../../../utils/trade/tradeQueries');

const {
  calculateProfitOptions
} = require('../../../utils/trade/tradeCalculations');

const {
  buildBestTradesEmbed,
  buildRouteEmbed,
  buildCircuitEmbed,
  buildPriceEmbed,
  buildShipEmbed,
  buildLocationsEmbed,
  buildCommoditiesEmbed
} = require('../../../utils/trade/tradeEmbeds');

const {
  handleTradeBest,
  handleTradeRoute,
  handleTradeBestCircuit,
  handleTradeFind,
  handleTradePrice,
  handleTradeShip,
  handleTradeLocations,
  handleTradeCommodities
} = require('../../../utils/trade/tradeHandlers');

const mockInteraction = () => ({
  user: {id: 'mock-user-id'},
  options: {
    getString: jest.fn(),
    getInteger: jest.fn()
  },
  reply: jest.fn()
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('tradeHandlers', () => {
  test('handleTradeBest replies with embed if profit options found', async () => {
    const interaction = mockInteraction();
    interaction.options.getString.mockReturnValueOnce('Port Olisar'); // from
  
    getSellOptionsAtLocation.mockResolvedValue([
      { price_buy: 1, price_sell: 2, commodity_name: 'Test', terminal: { name: 'Terminal A' } }
    ]);
    calculateProfitOptions.mockReturnValue([
      { commodity: 'Test', terminal: 'Terminal A', profitPerSCU: 1, cargoUsed: 10, totalProfit: 10 }
    ]);
    buildBestTradesEmbed.mockReturnValue({ embed: 'mockEmbed' });
  
    await handleTradeBest(interaction, {}, {
      //fromLocation: 'Port Olisar',
      shipQuery: 'Drake Cutlass Black',
      cash: 50000
    });
  
    expect(getSellOptionsAtLocation).toHaveBeenCalledWith('Port Olisar');
    expect(calculateProfitOptions).toHaveBeenCalled();
    expect(buildBestTradesEmbed).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({ embeds: [{ embed: 'mockEmbed' }] });
  });
  
  test('handleTradeBest replies with error if no sell options found', async () => {
    const interaction = mockInteraction();
    interaction.options.getString.mockReturnValueOnce('Port Olisar');
    getSellOptionsAtLocation.mockResolvedValue([]); // no results
  
    await handleTradeBest(interaction, {}, {
      fromLocation: 'Port Olisar',
      shipQuery: 'Drake Cutlass Black',
      cash: 50000
    });
  
    expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining('❌ No sell options'));
  });
  
  test('handleTradeBest replies with error if no profit options found', async () => {
    const interaction = mockInteraction();
    interaction.options.getString.mockReturnValueOnce('Port Olisar');
    getSellOptionsAtLocation.mockResolvedValue([
      { price_buy: 1, price_sell: 1, terminal: { name: 'Terminal A' } }
    ]);
    calculateProfitOptions.mockReturnValue([]); // no profit options
  
    await handleTradeBest(interaction, {}, {
      fromLocation: 'Port Olisar',
      shipQuery: 'Drake Cutlass Black',
      cash: 50000
    });
  
    expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining('❌ No profitable trades'));
  });  

  test('handleTradeRoute replies with embed if sell options found', async () => {
    const interaction = mockInteraction();
    interaction.options.getString.mockReturnValueOnce('Port Olisar').mockReturnValueOnce('Agricium'); // from, commodity
    getCommodityTradeOptions.mockResolvedValue([{ price_buy: 1, price_sell: 2, terminal: { name: 'Terminal B', city_name: 'Lorville' }, commodity_name: 'Agricium' }]);
    buildRouteEmbed.mockReturnValue({ embed: 'mockEmbed' });

    await handleTradeRoute(interaction);

    expect(getCommodityTradeOptions).toHaveBeenCalledWith('Agricium');
    expect(buildRouteEmbed).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({ embeds: [{ embed: 'mockEmbed' }] });
  });

  test('handleTradeRoute replies with error if no sell options found', async () => {
    const interaction = mockInteraction();
    interaction.options.getString.mockReturnValueOnce('Port Olisar').mockReturnValueOnce('Agricium');
    getCommodityTradeOptions.mockResolvedValue([]); // no options
  
    await handleTradeRoute(interaction);
  
    expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining('❌ No sell options'));
  });  

  test('handleTradeBestCircuit replies with embed if route found', async () => {
    const interaction = mockInteraction();
    interaction.options.getString.mockReturnValueOnce('Port Olisar'); // from
    getSellOptionsAtLocation.mockResolvedValue([{ price_buy: 1, price_sell: 2, commodity_name: 'Test', terminal: { name: 'Terminal A' } }]);
    calculateProfitOptions.mockReturnValue([{ commodity: 'Test', terminal: 'Terminal A', profitPerSCU: 1, cargoUsed: 10, totalProfit: 10 }]);
    getReturnOptions.mockResolvedValue([{ price_buy: 1, price_sell: 2, commodity_name: 'ReturnTest', terminal: { name: 'Terminal B' } }]);
    buildCircuitEmbed.mockReturnValue({ embed: 'mockEmbed' });

    await handleTradeBestCircuit(interaction);

    expect(getSellOptionsAtLocation).toHaveBeenCalled();
    expect(getReturnOptions).toHaveBeenCalled();
    expect(calculateProfitOptions).toHaveBeenCalled();
    expect(buildCircuitEmbed).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({ embeds: [{ embed: 'mockEmbed' }] });
  });

  test('handleTradeBestCircuit replies with error if no outbound profit found', async () => {
    const interaction = mockInteraction();
    interaction.options.getString.mockReturnValueOnce('Port Olisar');
    getSellOptionsAtLocation.mockResolvedValue([{ price_buy: 1, price_sell: 1, terminal: { name: 'Terminal A' } }]);
    calculateProfitOptions.mockReturnValue([]); // no outbound profit
  
    await handleTradeBestCircuit(interaction);
  
    expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining('❌ No outbound profitable trades'));
  });  

  test('handleTradeFind replies with embed if trade found', async () => {
    const interaction = mockInteraction();
    interaction.options.getString.mockReturnValueOnce('Port Olisar').mockReturnValueOnce('Lorville');
    getSellOptionsAtLocation.mockResolvedValue([{ price_buy: 1, price_sell: 2, terminal: { name: 'Lorville' }, commodity_name: 'Agricium' }]);
    calculateProfitOptions.mockReturnValue([{ commodity: 'Agricium', terminal: 'Lorville', profitPerSCU: 1, cargoUsed: 10, totalProfit: 10 }]);
    buildBestTradesEmbed.mockReturnValue({ embed: 'mockEmbed' });

    await handleTradeFind(interaction);

    expect(getSellOptionsAtLocation).toHaveBeenCalled();
    expect(buildBestTradesEmbed).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({ embeds: [{ embed: 'mockEmbed' }] });
  });

  test('handleTradeFind replies with error if no trades found', async () => {
    const interaction = mockInteraction();
    interaction.options.getString.mockReturnValueOnce('Port Olisar').mockReturnValueOnce('Lorville');
    getSellOptionsAtLocation.mockResolvedValue([]); // no trades
  
    await handleTradeFind(interaction);
  
    expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining('❌ No trades found'));
  });  

  test('handleTradePrice replies with embed if price data found', async () => {
    const interaction = mockInteraction();
    interaction.options.getString.mockReturnValueOnce('Agricium').mockReturnValueOnce('Port Olisar');
    getCommodityTradeOptions.mockResolvedValue([{ price_buy: 1, price_sell: 2, terminal: { name: 'Port Olisar' } }]);
    buildPriceEmbed.mockReturnValue({ embed: 'mockEmbed' });

    await handleTradePrice(interaction);

    expect(getCommodityTradeOptions).toHaveBeenCalledWith('Agricium');
    expect(buildPriceEmbed).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({ embeds: [{ embed: 'mockEmbed' }] });
  });

  test('handleTradePrice replies with error if no price data found', async () => {
    const interaction = mockInteraction();
    interaction.options.getString.mockReturnValueOnce('Agricium').mockReturnValueOnce('Port Olisar');
    getCommodityTradeOptions.mockResolvedValue([]); // no price data
  
    await handleTradePrice(interaction);
  
    expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining('❌ No price data found'));
  });  

  test('handleTradeShip replies with embed if ship found', async () => {
    const interaction = mockInteraction();
    interaction.options.getString.mockReturnValueOnce('Freelancer');
    getVehicleByName.mockResolvedValue({ name: 'Freelancer', scu: 66 });
    buildShipEmbed.mockReturnValue({ embed: 'mockEmbed' });

    await handleTradeShip(interaction);

    expect(getVehicleByName).toHaveBeenCalledWith('Freelancer');
    expect(buildShipEmbed).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({ embeds: [{ embed: 'mockEmbed' }] });
  });

  test('handleTradeShip replies with error if ship not found', async () => {
    const interaction = mockInteraction();
    interaction.options.getString.mockReturnValueOnce('NonexistentShip');
    getVehicleByName.mockResolvedValue(null); // no ship
  
    await handleTradeShip(interaction);
  
    expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining('❌ Ship'));
  });  

  test('handleTradeLocations replies with embed if terminals found', async () => {
    const interaction = mockInteraction();
    getTerminalsAtLocation.mockResolvedValue([{ name: 'Port Olisar', city_name: 'Orison' }]);
    buildLocationsEmbed.mockReturnValue({ embed: 'mockEmbed' });

    await handleTradeLocations(interaction);

    expect(getTerminalsAtLocation).toHaveBeenCalled();
    expect(buildLocationsEmbed).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({ embeds: [{ embed: 'mockEmbed' }] });
  });

  test('handleTradeLocations replies with error if no terminals found', async () => {
    const interaction = mockInteraction();
    getTerminalsAtLocation.mockResolvedValue([]); // no terminals
  
    await handleTradeLocations(interaction);
  
    expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining('❌ No known terminals'));
  });  

  test('handleTradeCommodities replies with embed if commodities found', async () => {
    const interaction = mockInteraction();
    getAllShipNames.mockResolvedValue(['Agricium', 'Laranite']);
    buildCommoditiesEmbed.mockReturnValue({ embed: 'mockEmbed' });

    await handleTradeCommodities(interaction);

    expect(getAllShipNames).toHaveBeenCalled();
    expect(buildCommoditiesEmbed).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({ embeds: [{ embed: 'mockEmbed' }] });
  });

  test('handleTradeCommodities replies with error if no commodities found', async () => {
    const interaction = mockInteraction();
    getAllShipNames.mockResolvedValue([]); // no commodities
  
    await handleTradeCommodities(interaction);
  
    expect(interaction.reply).toHaveBeenCalledWith(expect.stringContaining('❌ No known commodities'));
  });  
});
