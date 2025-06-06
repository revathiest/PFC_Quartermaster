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

    test('buildBestTradesEmbed supports shipName and null values', () => {
      const opts = [{ commodity: 'Agricium', fromTerminal: 'T1', toTerminal: 'T2', profitPerSCU: 1, returnOnInvestment: 1, cargoUsed: null, totalProfit: null }];
      const result = buildBestTradesEmbed('Area18', opts, 'Ship');
      expect(result.data.title).toContain('using Ship');
      expect(result.data.fields[0].value).toContain('No ship selected');
      expect(result.data.fields[0].value).toContain('Total: *N/A*');
    });
  
    test('buildRouteEmbed returns an embed with sell options', () => {
      const result = buildRouteEmbed('Agricium', 'Port Olisar', [
        { toTerminal: 'Terminal B', location: 'Lorville', sellPrice: 800, profitPerSCU: 300 }
      ]);
      expect(result.data.title).toContain('Agricium');
      expect(result.data.fields[0].name).toContain('Terminal B');
    });

    test('buildRouteEmbed handles missing fields', () => {
      const res = buildRouteEmbed('C', 'Loc', [{ }]);
      expect(res.data.fields[0].name).toContain('UNKNOWN_TERMINAL');
      expect(res.data.fields[0].value).toContain('N/A');
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

    test('buildCircuitEmbed falls back when fields missing', () => {
      const outbound = {};
      const res = buildCircuitEmbed(outbound, null, 'X');
      expect(res.data.fields[0].name).toContain('UNKNOWN_COMMODITY');
    });
  
    test('buildPriceEmbed returns embed with price data', () => {
      const result = buildPriceEmbed('Agricium', 'Port Olisar', [
        { terminal: 'Port Olisar', buyPrice: 500, sellPrice: 800 }
      ]);
      expect(result.data.title).toContain('Agricium');
      expect(result.data.fields[0].value).toContain('Buy:');
    });

    test('buildPriceEmbed handles null location and prices', () => {
      const res = buildPriceEmbed('Commodity', null, [{ }]);
      expect(res.data.title).toContain('Commodity');
      expect(res.data.fields[0].value).toContain('N/A');
    });
  
    test('buildShipEmbed returns embed with ship info', () => {
      const result = buildShipEmbed({ name: 'Freelancer', scu: 66, is_cargo: true });
      expect(result.data.title).toContain('Freelancer');
      expect(result.data.description).toContain('Cargo Capacity');
    });

    test('buildShipEmbed handles non-cargo ship', () => {
      const res = buildShipEmbed({ name: 'X', scu: 0, is_cargo: false });
      expect(res.data.description).toContain('Non-cargo');
    });

    test('buildShipEmbed uses fallbacks for missing fields', () => {
      const res = buildShipEmbed({});
      expect(res.data.title).toContain('UNKNOWN_NAME');
      expect(res.data.description).toContain('N/A');
    });
  
    test('buildLocationsEmbed returns embed with location names', () => {
      const result = buildLocationsEmbed([{ name: 'Terminal A', city_name: 'Lorville' }]);
      expect(result.data.fields[0].name).toContain('Terminal A');
    });

    test('buildCommoditiesEmbed shows no commodities message', () => {
      const res = buildCommoditiesEmbed('Loc', [{ terminal: 'T', commodities: [] }], 0, 1);
      expect(res.data.fields[0].value).toBe('```\n```');
    });
  
    test('buildCommoditiesEmbed returns embed grouped by terminal', () => {
      const data = [
        { terminal: 'T1', commodities: [{ name: 'Agricium', buyPrice: 1, sellPrice: 2 }] }
      ];
      const result = buildCommoditiesEmbed('Area18', data, 0, 1);
      expect(result.data.title).toContain('Area18');
      expect(result.data.fields[0].name).toBe('T1');
      const value = result.data.fields[0].value;
      expect(value.startsWith('```')).toBe(true);
      expect(value).toContain('Agricium');
      expect(result.data.footer.text).toContain('Page 1 of 1');
    });

    test('buildCommoditiesEmbed uses default paging', () => {
      const data = [{ terminal: 'T1', commodities: [] }];
      const embed = buildCommoditiesEmbed('Area18', data);
      expect(embed.data.footer.text).toContain('Page 1');
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
      expect(value.endsWith('...```')).toBe(true);
    });

    test('buildCommoditiesEmbed handles missing prices', () => {
      const data = [{ terminal: 'T1', commodities: [{ name: 'X' }] }];
      const res = buildCommoditiesEmbed('L', data, 0, 1);
      expect(res.data.fields[0].value).toContain('N/A');
    });

    test('buildCommoditiesEmbed truncates long commodity names', () => {
      const longName = 'Supercalifragilisticexpialidocious Commodity';
      const data = [{ terminal: 'T1', commodities: [{ name: longName, buyPrice: 1, sellPrice: 2 }] }];
      const result = buildCommoditiesEmbed('Area18', data, 0, 1);
      const value = result.data.fields[0].value;
      expect(value).toContain('…');
      const row = value.split('\n')[1];
      const namePart = row.split('|')[0].trim();
      expect(namePart.length).toBeLessThanOrEqual(22);
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

    describe('error handling', () => {
      beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
      });
      afterEach(() => {
        console.error.mockRestore();
      });

      test('buildBestTradesEmbed failure path', () => {
        const res = buildBestTradesEmbed('Port', null);
        expect(res.data.title).toContain('Failed to build trade embed');
      });

      test('buildRouteEmbed failure path', () => {
        const res = buildRouteEmbed('A', 'B', null);
        expect(res.data.title).toContain('Failed to build route embed');
      });

      test('buildCircuitEmbed failure path', () => {
        const res = buildCircuitEmbed(null, null, 'Loc');
        expect(res.data.title).toContain('Failed to build circuit embed');
      });

      test('buildPriceEmbed failure path', () => {
        const res = buildPriceEmbed('A', 'Loc', null);
        expect(res.data.title).toContain('Failed to build price embed');
      });

      test('buildShipEmbed failure path', () => {
        const res = buildShipEmbed(null);
        expect(res.data.title).toContain('Failed to build ship embed');
      });

      test('buildLocationsEmbed failure path', () => {
        const res = buildLocationsEmbed(null);
        expect(res.data.title).toContain('Failed to build locations embed');
      });

      test('buildCommoditiesEmbed failure path', () => {
        const res = buildCommoditiesEmbed('L', null);
        expect(res.data.title).toContain('Failed to build commodities embed');
      });
    });

  });
  