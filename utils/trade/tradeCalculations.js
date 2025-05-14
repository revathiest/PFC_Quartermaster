const DEBUG_CALC = false; // 🔥 toggle debug logs on/off

function calculateProfitOptions(records, shipSCU, availableCash) {
  if(DEBUG_CALC) console.log('calculateProfitOptions called')
  try {
    return records.map((record, index) => {
      const buyPrice = record.buyPrice ?? record.price_buy ?? 0;
      const sellPrice = record.sellPrice ?? record.price_sell ?? 0;
      const profitPerSCU = sellPrice - buyPrice;

      const stockAvailable = record.scu_buy ?? shipSCU;
      if (DEBUG_CALC) console.log(`[CALC] Record #${index}: commodity=${record.commodity_name}, buyPrice=${buyPrice}, sellPrice=${sellPrice}, stockAvailable=${stockAvailable}, shipSCU=${shipSCU}, availableCash=${availableCash}`);

      let maxAffordableSCU;

      if (availableCash == null) {
        maxAffordableSCU = Math.min(shipSCU, stockAvailable);
        if (DEBUG_CALC) console.log(`[CALC] availableCash is null → using max capacity: ${maxAffordableSCU}`);
      } else if (buyPrice <= 0) {
        if (DEBUG_CALC) console.warn(`[CALC] 🚩 Skipping ${record.commodity_name}: buy price invalid (${buyPrice})`);
        maxAffordableSCU = 0;
      } else {
        maxAffordableSCU = Math.min(
          shipSCU,
          stockAvailable,
          Math.floor(availableCash / buyPrice)
        );
        if (DEBUG_CALC) console.log(`[CALC] Calculated maxAffordableSCU=${maxAffordableSCU}`);
      }

      const totalProfit = maxAffordableSCU * profitPerSCU;
      if (DEBUG_CALC) console.log(`[CALC] totalProfit=${totalProfit} (profitPerSCU=${profitPerSCU} * maxAffordableSCU=${maxAffordableSCU})`);

      return {
        commodity: record.commodity_name,
        fromTerminal: record.terminal?.name,
        toTerminal: record.sellTerminal?.name ?? "unknown",
        location: record.terminal?.poi?.name ?? record.terminal?.city_name ?? record.terminal?.planet_name,
        buyPrice,
        sellPrice,
        profitPerSCU,
        cargoUsed: maxAffordableSCU,
        totalProfit: totalProfit || 0
      };
    }).filter(option => option.profitPerSCU > 0 && option.cargoUsed > 0);
  } catch (err) {
    console.error(`[TRADE CALCULATIONS] calculateProfitOptions encountered an error:`, err);
    return [];
  }
}

function calculateCircuitTotalProfit(outbound, returnTrip) {
  try {
    if (DEBUG_CALC) console.log(`[TRADE CALCULATIONS] calculateCircuitTotalProfit → outbound=${outbound?.totalProfit}, returnTrip=${returnTrip?.totalProfit}`);
    const outboundProfit = outbound?.totalProfit ?? 0;
    const returnProfit = returnTrip?.totalProfit ?? 0;
    const total = outboundProfit + returnProfit;
    if (DEBUG_CALC) console.log(`[TRADE CALCULATIONS] Total circuit profit: ${total}`);
    return total;
  } catch (err) {
    console.error(`[TRADE CALCULATIONS] calculateCircuitTotalProfit encountered an error:`, err);
    return 0;
  }
}

function calculateTravelCost(baseDistance, multiplier = 1) {
  try {
    if (DEBUG_CALC) console.log(`[TRADE CALCULATIONS] calculateTravelCost → baseDistance=${baseDistance}, multiplier=${multiplier}`);
    const cost = baseDistance * multiplier;
    if (DEBUG_CALC) console.log(`[TRADE CALCULATIONS] Travel cost: ${cost}`);
    return cost;
  } catch (err) {
    console.error(`[TRADE CALCULATIONS] calculateTravelCost encountered an error:`, err);
    return null;
  }
}

function calculateMaxCargo(shipSCU, stockAvailable, availableCash, pricePerSCU) {
  try {
    if (DEBUG_CALC) console.log(`[TRADE CALCULATIONS] calculateMaxCargo → shipSCU=${shipSCU}, stockAvailable=${stockAvailable}, availableCash=${availableCash}, pricePerSCU=${pricePerSCU}`);
    const maxCargo = Math.min(
      shipSCU,
      stockAvailable ?? shipSCU,
      Math.floor(availableCash / (pricePerSCU || 1))
    );
    if (DEBUG_CALC) console.log(`[TRADE CALCULATIONS] Max cargo: ${maxCargo}`);
    return maxCargo;
  } catch (err) {
    console.error(`[TRADE CALCULATIONS] calculateMaxCargo encountered an error:`, err);
    return 0;
  }
}

function calculateProfitPerJump(totalProfit, jumpCount) {
  try {
    if (DEBUG_CALC) console.log(`[TRADE CALCULATIONS] calculateProfitPerJump → totalProfit=${totalProfit}, jumpCount=${jumpCount}`);
    const result = jumpCount > 0 ? (totalProfit / jumpCount) : totalProfit;
    if (DEBUG_CALC) console.log(`[TRADE CALCULATIONS] Profit per jump: ${result}`);
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
