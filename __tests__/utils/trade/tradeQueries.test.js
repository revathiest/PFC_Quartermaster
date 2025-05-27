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

const {
  getCommodityTradeOptions,
  getSellOptionsAtLocation,
  getBuyOptionsAtLocation,
  getVehicleByName,
  getAllShipNames,
  getReturnOptions,
  getTerminalsAtLocation,
  getDistanceBetween
} = require('../../../utils/trade/tradeQueries');

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
});
