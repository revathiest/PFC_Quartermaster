const {
    calculateProfitOptions,
    calculateCircuitTotalProfit,
    calculateTravelCost,
    calculateMaxCargo,
    calculateProfitPerJump
  } = require('../../../utils/trade/tradeCalculations');
  
  describe('tradeCalculations', () => {
    describe('calculateProfitOptions', () => {
      test('returns correct profit options with positive profit', () => {
        const records = [{
          commodity_name: 'Agricium',
          price_buy: 500,
          price_sell: 800,
          scu_buy: 50,
          terminal: { name: 'Terminal A', poi: { name: 'Location X' } }
        }];
        const shipSCU = 66;
        const cash = 100_000;
  
        const results = calculateProfitOptions(records, shipSCU, cash);
  
        expect(results).toHaveLength(1);
        expect(results[0]).toMatchObject({
          commodity: 'Agricium',
          fromTerminal: 'Terminal A',
          location: 'Location X',
          profitPerSCU: 300,
          totalProfit: expect.any(Number)
        });
        expect(results[0].cargoUsed).toBeLessThanOrEqual(50);
      });
  
      test('filters out zero or negative profits', () => {
        const records = [{
          commodity_name: 'Titanium',
          price_buy: 500,
          price_sell: 400, // negative profit
          scu_buy: 100,
          terminal: { name: 'Terminal B', poi: { name: 'Location Y' } }
        }];
        const results = calculateProfitOptions(records, 66, 100_000);
        expect(results).toHaveLength(0);
      });

      test('handles missing terminal or poi gracefully', () => {
        const records = [{
          commodity_name: 'Agricium',
          price_buy: 500,
          price_sell: 800,
          scu_buy: 50,
          terminal: null // missing terminal
        }];
        const results = calculateProfitOptions(records, 66, 100_000);
        expect(results[0].fromTerminal).toBeUndefined();
        expect(results[0].location).toBeUndefined();
      });
      
      test('handles buyPrice of zero without divide by zero', () => {
        const records = [{
          commodity_name: 'Agricium',
          price_buy: 0,
          price_sell: 800,
          scu_buy: 50,
          terminal: { name: 'Terminal A', poi: { name: 'Location X' } }
        }];
        const results = calculateProfitOptions(records, 66, 100_000);
        expect(results).toHaveLength(0);
      });      
    });
  
    describe('calculateCircuitTotalProfit', () => {
      test('returns sum of outbound and return profit', () => {
        const outbound = { totalProfit: 5000 };
        const returnTrip = { totalProfit: 2000 };
        const total = calculateCircuitTotalProfit(outbound, returnTrip);
        expect(total).toBe(7000);
      });
  
      test('handles null returnTrip', () => {
        const outbound = { totalProfit: 5000 };
        const total = calculateCircuitTotalProfit(outbound, null);
        expect(total).toBe(5000);
      });
    });
  
    describe('calculateTravelCost', () => {
      test('returns distance multiplied by multiplier', () => {
        expect(calculateTravelCost(10, 1)).toBe(10);
        expect(calculateTravelCost(10, 2)).toBe(20);
        expect(calculateTravelCost(0, 5)).toBe(0);
      });
    });
  
    describe('calculateMaxCargo', () => {
      test('returns min of ship, stock, and affordable', () => {
        const result = calculateMaxCargo(66, 50, 10000, 100);
        expect(result).toBe(50); // limited by stock
      });
  
      test('limits by cash', () => {
        const result = calculateMaxCargo(66, 100, 500, 100); // can afford 5 SCU
        expect(result).toBe(5);
      });
  
      test('limits by ship capacity', () => {
        const result = calculateMaxCargo(30, 100, 1_000_000, 100);
        expect(result).toBe(30);
      });

      test('handles pricePerSCU zero safely', () => {
        const result = calculateMaxCargo(66, 100, 1000, 0);
        expect(result).toBe(66);
      });      
    });
  
  describe('calculateProfitPerJump', () => {
    test('returns total profit if jumpCount = 0', () => {
      expect(calculateProfitPerJump(5000, 0)).toBe(5000);
    });
  
      test('returns profit per jump', () => {
        expect(calculateProfitPerJump(5000, 5)).toBe(1000);
      });

      test('handles negative jumpCount by returning totalProfit', () => {
      expect(calculateProfitPerJump(5000, -2)).toBe(5000);
    });
  });

  describe('additional edge cases', () => {
    test('uses ship capacity when cash is null and includes sellTerminal', () => {
      const records = [{
        commodity_name: 'Titanium',
        price_buy: 10,
        price_sell: 20,
        scu_buy: 5,
        terminal: { name: 'T1', poi: { name: 'Loc' } },
        sellTerminal: { name: 'SellT' }
      }];
      const res = calculateProfitOptions(records, 10, null);
      expect(res[0].cargoUsed).toBe(5);
      expect(res[0].toTerminal).toBe('SellT');
    });

    test('skips option when cash insufficient', () => {
      const records = [{
        commodity_name: 'Laranite',
        price_buy: 200,
        price_sell: 300,
        scu_buy: 5,
        terminal: { name: 'T1', poi: { name: 'Loc' } }
      }];
      const res = calculateProfitOptions(records, 10, 100);
      expect(res).toEqual([]);
    });

    test('results sorted by profit per SCU', () => {
      const records = [
        { commodity_name: 'A', price_buy: 10, price_sell: 20, scu_buy: 10, terminal: { name: 'T1', poi: { name: 'L' } } },
        { commodity_name: 'B', price_buy: 5, price_sell: 30, scu_buy: 10, terminal: { name: 'T1', poi: { name: 'L' } } }
      ];
      const res = calculateProfitOptions(records, 10, 1000);
      expect(res[0].commodity).toBe('B');
      expect(res[0].returnOnInvestment).toBe('500%');
      expect(res[1].commodity).toBe('A');
    });

    test('returns empty array on invalid input', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = calculateProfitOptions(null);
      expect(res).toEqual([]);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
  