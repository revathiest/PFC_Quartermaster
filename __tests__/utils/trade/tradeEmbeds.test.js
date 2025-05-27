const {
    buildBestTradesEmbed,
    buildRouteEmbed,
    buildCircuitEmbed,
    buildPriceEmbed,
    buildShipEmbed,
    buildLocationsEmbed,
    buildCommoditiesEmbed
  } = require('../../../utils/trade/tradeEmbeds');
  
  describe('tradeEmbeds', () => {
    test('buildBestTradesEmbed returns an embed with expected fields', () => {
      const result = buildBestTradesEmbed('Port Olisar', [
        { commodity: 'Agricium', terminal: 'Terminal A', profitPerSCU: 300, cargoUsed: 10, totalProfit: 3000 }
      ]);
      expect(result).toHaveProperty('data');
      expect(result.data.title).toContain('Port Olisar');
      expect(result.data.fields).toHaveLength(1);
    });
  
    test('buildRouteEmbed returns an embed with sell options', () => {
      const result = buildRouteEmbed('Agricium', 'Port Olisar', [
        { toTerminal: 'Terminal B', location: 'Lorville', sellPrice: 800, profitPerSCU: 300 }
      ]);
      expect(result.data.title).toContain('Agricium');
      expect(result.data.fields[0].name).toContain('Terminal B');
    });
  
    test('buildCircuitEmbed returns embed with outbound + return fields', () => {
      const outbound = { commodity: 'Agricium', terminal: 'Lorville', profitPerSCU: 300, cargoUsed: 10, totalProfit: 3000 };
      const returnTrip = { commodity: 'Titanium', terminal: 'Port Olisar', profitPerSCU: 200, cargoUsed: 10, totalProfit: 2000 };
      const result = buildCircuitEmbed(outbound, returnTrip, 'Port Olisar');
      expect(result.data.title).toContain('Port Olisar');
      expect(result.data.fields).toHaveLength(2);
      expect(result.data.fields[0].name).toContain('Outbound');
      expect(result.data.fields[1].name).toContain('Return');
    });
  
    test('buildCircuitEmbed handles null returnTrip', () => {
      const outbound = { commodity: 'Agricium', terminal: 'Lorville', profitPerSCU: 300, cargoUsed: 10, totalProfit: 3000 };
      const result = buildCircuitEmbed(outbound, null, 'Port Olisar');
      expect(result.data.fields).toHaveLength(2);
      expect(result.data.fields[1].value).toContain('No profitable return');
    });
  
    test('buildPriceEmbed returns embed with price data', () => {
      const result = buildPriceEmbed('Agricium', 'Port Olisar', [
        { terminal: 'Port Olisar', buyPrice: 500, sellPrice: 800 }
      ]);
      expect(result.data.title).toContain('Agricium');
      expect(result.data.fields[0].value).toContain('Buy:');
    });
  
    test('buildShipEmbed returns embed with ship info', () => {
      const result = buildShipEmbed({ name: 'Freelancer', scu: 66, is_cargo: true });
      expect(result.data.title).toContain('Freelancer');
      expect(result.data.description).toContain('Cargo Capacity');
    });
  
    test('buildLocationsEmbed returns embed with location names', () => {
      const result = buildLocationsEmbed([{ name: 'Terminal A', city_name: 'Lorville' }]);
      expect(result.data.fields[0].name).toContain('Terminal A');
    });
  
    test('buildCommoditiesEmbed returns embed grouped by terminal', () => {
      const data = [
        { terminal: 'T1', commodities: [{ name: 'Agricium', buyPrice: 1, sellPrice: 2 }] }
      ];
      const result = buildCommoditiesEmbed('Area18', data, 0, 1);
      expect(result.data.title).toContain('Area18');
      expect(result.data.fields[0].name).toBe('T1');
      expect(result.data.fields[0].value).toContain('Agricium');
      expect(result.data.fields[0].value).toContain('Buy:');
      expect(result.data.fields[0].value).not.toContain('Avg');
      expect(result.data.footer.text).toContain('Page 1 of 1');
    });

    test('buildCommoditiesEmbed truncates long field values', () => {
      const longList = Array.from({ length: 300 }, (_, i) => ({
        name: `Item${i}`,
        buyPrice: i,
        sellPrice: i + 1
      }));
      const data = [{ terminal: 'T1', commodities: longList }];
      const result = buildCommoditiesEmbed('Area18', data, 0, 1);
      const value = result.data.fields[0].value;
      expect(value.length).toBeLessThanOrEqual(1024);
      expect(value.endsWith('...')).toBe(true);
    });
    
    test('buildLocationsEmbed uses planet_name fallback', () => {
      const result = buildLocationsEmbed([{ name: 'Terminal A', planet_name: 'MicroTech' }]);
      expect(result.data.fields[0].value).toBe('MicroTech');
    });
    
    test('buildLocationsEmbed uses Unknown fallback if no names', () => {
      const result = buildLocationsEmbed([{ name: 'Terminal A' }]);
      expect(result.data.fields[0].value).toBe('Unknown');
    });
    
    test('buildBestTradesEmbed handles empty profitOptions', () => {
      const result = buildBestTradesEmbed('Port Olisar', []);
      expect(result.data.fields).toHaveLength(0);
    });
    
    test('buildBestTradesEmbed limits fields to 5 entries', () => {
      const input = Array.from({ length: 10 }, (_, i) => ({
        commodity: `Item ${i}`,
        terminal: `Terminal ${i}`,
        profitPerSCU: 100,
        cargoUsed: 10,
        totalProfit: 1000
      }));
      const result = buildBestTradesEmbed('Port Olisar', input);
      expect(result.data.fields).toHaveLength(5);
    });
    
    test('buildRouteEmbed handles empty sellOptions', () => {
      const result = buildRouteEmbed('Agricium', 'Port Olisar', []);
      expect(result.data.fields).toHaveLength(0);
    });
    
    test('buildRouteEmbed limits fields to 5 entries', () => {
      const input = Array.from({ length: 10 }, (_, i) => ({
        terminal: `Terminal ${i}`,
        location: `Location ${i}`,
        sellPrice: 800,
        profitPerSCU: 300
      }));
      const result = buildRouteEmbed('Agricium', 'Port Olisar', input);
      expect(result.data.fields).toHaveLength(5);
    });
    
    test('buildPriceEmbed handles empty priceOptions', () => {
      const result = buildPriceEmbed('Agricium', 'Port Olisar', []);
      expect(result.data.fields).toHaveLength(0);
    });
    
    test('buildPriceEmbed limits fields to 5 entries', () => {
      const input = Array.from({ length: 10 }, (_, i) => ({
        terminal: `Terminal ${i}`,
        buyPrice: 500,
        sellPrice: 800
      }));
      const result = buildPriceEmbed('Agricium', 'Port Olisar', input);
      expect(result.data.fields).toHaveLength(5);
    });
    
    test('buildLocationsEmbed handles empty terminals array', () => {
      const result = buildLocationsEmbed([]);
      expect(result.data.fields).toHaveLength(0);
    });
    
    test('buildLocationsEmbed limits fields to 10 entries', () => {
      const input = Array.from({ length: 20 }, (_, i) => ({
        name: `Terminal ${i}`,
        city_name: `City ${i}`
      }));
      const result = buildLocationsEmbed(input);
      expect(result.data.fields).toHaveLength(10);
    });
    
  });
  