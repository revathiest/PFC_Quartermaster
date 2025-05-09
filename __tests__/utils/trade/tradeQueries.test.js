const { sequelize } = require('../../../config/database');
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

beforeAll(async () => {
  await sequelize.authenticate();
});

afterAll(async () => {
  await sequelize.close();
});

describe('tradeQueries integration tests', () => {
  test('getCommodityTradeOptions returns records with terminal and poi', async () => {
    const results = await getCommodityTradeOptions('Agricium');
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      const r = results[0];
      expect(r).toHaveProperty('commodity_name', 'Agricium');
      expect(r).toHaveProperty('price_buy');
      expect(r).toHaveProperty('price_sell');
      expect(r.terminal).toBeDefined();
      expect(r.terminal).toHaveProperty('name');
      if (r.terminal.poi) {
        expect(r.terminal.poi).toHaveProperty('name');
      }
    }
  });

  test('getCommodityTradeOptions returns empty array for unknown commodity', async () => {
    const results = await getCommodityTradeOptions('NonexistentCommodity123');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });  

  test('getSellOptionsAtLocation returns sell options for location', async () => {
    const results = await getSellOptionsAtLocation('Port Olisar');
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      const r = results[0];
      expect(r).toHaveProperty('commodity_name');
      expect(r).toHaveProperty('price_sell');
      expect(r.terminal).toBeDefined();
      expect(r.terminal).toHaveProperty('name');
    }
  });

  test('getBuyOptionsAtLocation returns buy options for location', async () => {
    const results = await getBuyOptionsAtLocation('Port Olisar');
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      const r = results[0];
      expect(r).toHaveProperty('commodity_name');
      expect(r).toHaveProperty('price_buy');
      expect(r.terminal).toBeDefined();
    }
  });

  test('getVehicleByName returns vehicle by name/slug/full name', async () => {
    const vehicle = await getVehicleByName('Freelancer');
    expect(vehicle).toBeTruthy();
    expect(vehicle).toHaveProperty('name');
    expect(vehicle).toHaveProperty('scu');
  });

  test('getVehicleByName returns null for unknown name', async () => {
    const vehicle = await getVehicleByName('NonexistentShipName123');
    expect(vehicle).toBeNull();
  });  

  test('getAllShipNames returns array of ship names', async () => {
    const ships = await getAllShipNames();
    expect(Array.isArray(ships)).toBe(true);
    expect(ships.length).toBeGreaterThan(0);
    expect(ships[0]).toEqual(expect.any(String));
  });

  test('getTerminalsAtLocation returns terminals for location', async () => {
    const results = await getTerminalsAtLocation('Port Olisar');
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0]).toHaveProperty('name');
    }
  });

  test('getReturnOptions returns commodities that can be sold back', async () => {
    const results = await getReturnOptions('Port Olisar', 'Lorville');
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0]).toHaveProperty('commodity_name');
      expect(results[0]).toHaveProperty('price_buy');
      expect(results[0]).toHaveProperty('price_sell');
      expect(results[0].terminal).toHaveProperty('name');
    }
  });

  test('getReturnOptions returns empty array if no matching return options', async () => {
    const results = await getReturnOptions('Nowhere', 'AlsoNowhere');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });  

  test('getDistanceBetween returns null (placeholder)', async () => {
    const dist = await getDistanceBetween('Port Olisar', 'Lorville');
    expect(dist).toBeNull();
  });

  test('getSellOptionsAtLocation returns empty array for unknown location', async () => {
    const results = await getSellOptionsAtLocation('NonexistentLocation123');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
  
  test('getBuyOptionsAtLocation returns empty array for unknown location', async () => {
    const results = await getBuyOptionsAtLocation('NonexistentLocation123');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
  
  test('getTerminalsAtLocation returns empty array for unknown location', async () => {
    const results = await getTerminalsAtLocation('NonexistentLocation123');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });  
});
