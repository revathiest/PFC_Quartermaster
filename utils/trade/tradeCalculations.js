function calculateProfitOptions(records, shipSCU, availableCash) {
  try {
    const options = [];

    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      const buyPrice = record.buyPrice ?? record.price_buy ?? 0;
      const sellPrice = record.sellPrice ?? record.price_sell ?? 0;

      if (buyPrice <= 0 || sellPrice <= 0) {
        continue;
      }

      const profitPerSCU = sellPrice - buyPrice;
      if (profitPerSCU <= 0) {
        continue;
      }

      const stockAvailable = record.scu_buy ?? shipSCU;

      let maxAffordableSCU;

      if (availableCash == null) {
        maxAffordableSCU = Math.min(shipSCU, stockAvailable);
      } else {
        maxAffordableSCU = Math.min(
          shipSCU,
          stockAvailable,
          Math.floor(availableCash / buyPrice)
        );
      }

      if (maxAffordableSCU <= 0) {
        continue;
      }

      const totalProfit = maxAffordableSCU * profitPerSCU;
      const returnOnInvestment = `${((profitPerSCU/buyPrice)*100).toFixed(0)}%`;

      options.push({
        commodity: record.commodity_name,
        fromTerminal: record.terminal?.name,
        toTerminal: record.sellTerminal?.name ?? "unknown",
        location: record.terminal?.poi?.name ?? record.terminal?.city_name ?? record.terminal?.planet_name,
        buyPrice,
        sellPrice,
        profitPerSCU,
        cargoUsed: maxAffordableSCU,
        totalProfit,
        returnOnInvestment
      });
    }

    // ✅ FINAL SORT
    return options.sort((a, b) => b.profitPerSCU - a.profitPerSCU);

  } catch (err) {
    console.error(`[TRADE CALCULATIONS] calculateProfitOptions encountered an error:`, err);
    return [];
  }
}

function calculateCircuitTotalProfit(outbound, returnTrip) {
  try {
    const outboundProfit = outbound?.totalProfit ?? 0;
    const returnProfit = returnTrip?.totalProfit ?? 0;
    const total = outboundProfit + returnProfit;
    return total;
  } catch (err) {
    console.error(`[TRADE CALCULATIONS] calculateCircuitTotalProfit encountered an error:`, err);
    return 0;
  }
}

function calculateTravelCost(baseDistance, multiplier = 1) {
  try {
    const cost = baseDistance * multiplier;
    return cost;
  } catch (err) {
    console.error(`[TRADE CALCULATIONS] calculateTravelCost encountered an error:`, err);
    return null;
  }
}

function calculateMaxCargo(shipSCU, stockAvailable, availableCash, pricePerSCU) {
  try {
    const maxCargo = Math.min(
      shipSCU,
      stockAvailable ?? shipSCU,
      Math.floor(availableCash / (pricePerSCU || 1))
    );
    return maxCargo;
  } catch (err) {
    console.error(`[TRADE CALCULATIONS] calculateMaxCargo encountered an error:`, err);
    return 0;
  }
}

function calculateProfitPerJump(totalProfit, jumpCount) {
  try {
    const result = jumpCount > 0 ? (totalProfit / jumpCount) : totalProfit;
    return result;
  } catch (err) {
    console.error(`[TRADE CALCULATIONS] calculateProfitPerJump encountered an error:`, err);
    return totalProfit;
  }
}

module.exports = {
  calculateProfitOptions,
  calculateCircuitTotalProfit,
  calculateTravelCost,
  calculateMaxCargo,
  calculateProfitPerJump
};
