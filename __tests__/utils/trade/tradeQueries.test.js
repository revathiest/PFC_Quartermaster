jest.mock('../../../config/database', () => ({
  UexCommodityPrice: { findAll: jest.fn() },
  UexTerminal: { findAll: jest.fn() },
  UexPoi: {},
  UexVehicle: { findAll: jest.fn() },
  sequelize: { authenticate: jest.fn(), close: jest.fn() }
}));

const {
  UexCommodityPrice,
  UexTerminal,
  UexVehicle,
  sequelize
} = require('../../../config/database');
const { Op } = require('sequelize');

const tradeQueries = require('../../../utils/trade/tradeQueries');
const {
  getCommodityTradeOptions,
  getSellOptionsAtLocation,
  getBuyOptionsAtLocation,
  getVehicleByName,
  getAllShipNames,
  getReturnOptions,
  getTerminalsAtLocation,
  getDistanceBetween,
  getSellPricesForCommodityElsewhere
} = tradeQueries;

describe('tradeQueries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getCommodityTradeOptions returns DB results', async () => {
    const mockResults = [{ commodity_name: 'Agricium' }];
    UexCommodityPrice.findAll.mockResolvedValue(mockResults);
    const res = await getCommodityTradeOptions('Agricium');
    expect(UexCommodityPrice.findAll).toHaveBeenCalled();
    expect(res).toBe(mockResults);
  });

  test('getCommodityTradeOptions returns empty array on error', async () => {
    UexCommodityPrice.findAll.mockRejectedValue(new Error('db'));
    const res = await getCommodityTradeOptions('Foo');
    expect(res).toEqual([]);
  });

  test('getSellOptionsAtLocation returns DB results', async () => {
    const mockResults = [{ commodity_name: 'Laranite', terminal: {} }];
    UexCommodityPrice.findAll.mockResolvedValue(mockResults);
    const res = await getSellOptionsAtLocation('Area18');
    expect(UexCommodityPrice.findAll).toHaveBeenCalled();
    expect(res).toBe(mockResults);
  });

  test('getBuyOptionsAtLocation returns DB results', async () => {
    const mockResults = [{ commodity_name: 'Titanium', terminal: {} }];
    UexCommodityPrice.findAll.mockResolvedValue(mockResults);
    const res = await getBuyOptionsAtLocation('Area18');
    expect(UexCommodityPrice.findAll).toHaveBeenCalled();
    expect(res).toBe(mockResults);
  });

  test('getVehicleByName returns DB results', async () => {
    const mockVehicles = [{ name: 'Cutlass' }];
    UexVehicle.findAll.mockResolvedValue(mockVehicles);
    const res = await getVehicleByName('Cutlass');
    expect(UexVehicle.findAll).toHaveBeenCalled();
    expect(res).toBe(mockVehicles);
  });

  test('getVehicleByName returns empty array on error', async () => {
    UexVehicle.findAll.mockRejectedValue(new Error('fail'));
    const res = await getVehicleByName('Bad');
    expect(res).toEqual([]);
  });

  test('getAllShipNames maps vehicle names', async () => {
    const mockVehicles = [{ name: 'Ship1' }, { name: 'Ship2' }];
    UexVehicle.findAll.mockResolvedValue(mockVehicles);
    const res = await getAllShipNames();
    expect(res).toEqual(['Ship1', 'Ship2']);
  });

  test('getTerminalsAtLocation returns DB results', async () => {
    const mockTerms = [{ name: 'T1' }];
    UexTerminal.findAll.mockResolvedValue(mockTerms);
    const res = await getTerminalsAtLocation('Area18');
    expect(UexTerminal.findAll).toHaveBeenCalled();
    expect(res).toBe(mockTerms);
  });

  test('getReturnOptions returns DB results', async () => {
    UexCommodityPrice.findAll.mockResolvedValue([]);
    const res = await getReturnOptions('A', 'B');
    expect(UexCommodityPrice.findAll).toHaveBeenCalled();
    expect(Array.isArray(res)).toBe(true);
  });

  test('getDistanceBetween returns null placeholder', async () => {
    const res = await getDistanceBetween('A', 'B');
    expect(res).toBeNull();
  });

  test('getSellOptionsAtLocation returns empty array on error', async () => {
    UexCommodityPrice.findAll.mockRejectedValue(new Error('db'));
    const res = await getSellOptionsAtLocation('Area18');
    expect(res).toEqual([]);
  });

  test('getBuyOptionsAtLocation returns empty array on error', async () => {
    UexCommodityPrice.findAll.mockRejectedValue(new Error('db'));
    const res = await getBuyOptionsAtLocation('Area18');
    expect(res).toEqual([]);
  });

  test('getVehicleByName warns when no match found', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    UexVehicle.findAll.mockResolvedValue([]);
    const res = await getVehicleByName('Unknown');
    expect(res).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test('getAllShipNames returns empty array on error', async () => {
    UexVehicle.findAll.mockRejectedValue(new Error('oops'));
    const res = await getAllShipNames();
    expect(res).toEqual([]);
  });

  test('getTerminalsAtLocation returns empty array on error', async () => {
    UexTerminal.findAll.mockRejectedValue(new Error('bad'));
    const res = await getTerminalsAtLocation('Area18');
    expect(res).toEqual([]);
  });

  test('getReturnOptions filters by terminal names', async () => {
    UexTerminal.findAll.mockResolvedValue([{ name: 'T1' }]);
    const records = [{ terminal_name: 'T1' }, { terminal_name: 'T2' }];
    UexCommodityPrice.findAll.mockResolvedValue(records);
    const res = await getReturnOptions('LocA', 'LocB');
    expect(res).toEqual([{ terminal_name: 'T1' }]);
  });

  test('getReturnOptions returns empty array on error', async () => {
    UexTerminal.findAll.mockRejectedValue(new Error('fail'));
    const res = await getReturnOptions('LocA', 'LocB');
    expect(res).toEqual([]);
  });

  test('getSellPricesForCommodityElsewhere returns DB results', async () => {
    const rows = [{ id: 1 }];
    UexCommodityPrice.findAll.mockResolvedValue(rows);
    const res = await getSellPricesForCommodityElsewhere('A', 'Loc');
    expect(UexCommodityPrice.findAll).toHaveBeenCalled();
    expect(res).toBe(rows);
  });

  test('getSellPricesForCommodityElsewhere returns empty array on error', async () => {
    UexCommodityPrice.findAll.mockRejectedValue(new Error('fail'));
    const res = await getSellPricesForCommodityElsewhere('A', 'Loc');
    expect(res).toEqual([]);
  });

  test('getCommodityTradeOptions queries by commodity name', async () => {
    UexCommodityPrice.findAll.mockResolvedValue([]);
    await getCommodityTradeOptions('Agricium');
    expect(UexCommodityPrice.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { commodity_name: 'Agricium' }
    }));
  });

  test('getBuyOptionsAtLocation filters by buy price and location', async () => {
    UexCommodityPrice.findAll.mockResolvedValue([]);
    await getBuyOptionsAtLocation('Area18');
    expect(UexCommodityPrice.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { price_buy: { [Op.not]: 0 } },
      include: expect.any(Array)
    }));
  });

  test('getSellPricesForCommodityElsewhere excludes given location', async () => {
    UexCommodityPrice.findAll.mockResolvedValue([]);
    await getSellPricesForCommodityElsewhere('Laranite', 'Area18');
    expect(UexCommodityPrice.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ commodity_name: 'Laranite' }),
      include: expect.arrayContaining([
        expect.objectContaining({
          where: expect.objectContaining({
            [Op.or]: expect.arrayContaining([
              expect.objectContaining({ name: { [Op.not]: 'Area18' } })
            ])
          })
        })
      ])
    }));
  });

  test('getReturnOptions logs error on DB failure', async () => {
    const error = new Error('db fail');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    UexCommodityPrice.findAll.mockRejectedValue(error);
    const res = await getReturnOptions('LocA', 'LocB');
    expect(res).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      '[TRADE QUERIES] getReturnOptions encountered an error:',
      error
    );
    console.error.mockRestore();
  });
});
