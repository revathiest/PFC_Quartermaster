const DEBUG_QUERY = false;

const { Op } = require('sequelize');
const { UexCommodityPrice, UexTerminal, UexPoi, UexVehicle } = require('../../config/database');

async function getCommodityTradeOptions(commodityName) {
  try {
    if (DEBUG_QUERY) console.log(`[TRADE QUERIES] getCommodityTradeOptions → commodityName="${commodityName}"`);
    const results = await UexCommodityPrice.findAll({
      where: { commodity_name: commodityName },
      include: [{ model: UexTerminal, as: 'terminal', required: true, include: [{ model: UexPoi, as: 'poi' }] }]
    });
    if (DEBUG_QUERY) console.log(`[TRADE QUERIES] getCommodityTradeOptions → found ${results.length} records`);
    return results;
  } catch (err) {
    console.error(`[TRADE QUERIES] getCommodityTradeOptions encountered an error:`, err);
    return [];
  }
}

async function getSellOptionsAtLocation(locationName) {
  try {
    if (DEBUG_QUERY) console.log(`[TRADE QUERIES] getSellOptionsAtLocation → locationName="${locationName}"`);
    const results = await UexCommodityPrice.findAll({
      include: [{
        model: UexTerminal,
        as: 'terminal',
        required: true,
        where: {
          [Op.or]: [
            { name: locationName },
            { nickname: locationName },
            { city_name: locationName },
            { planet_name: locationName }
          ]
        },
        include: [{ model: UexPoi, as: 'poi' }]
      }]
    });
    if (DEBUG_QUERY) console.log(`[TRADE QUERIES] getSellOptionsAtLocation → found ${results.length} records`);
    return results;
  } catch (err) {
    console.error(`[TRADE QUERIES] getSellOptionsAtLocation encountered an error:`, err);
    return [];
  }
}

async function getVehicleByName(shipName) {
  try {
    if (DEBUG_QUERY) console.log(`[TRADE QUERIES] getVehicleByName → shipName="${shipName}"`);

    const vehicles = await UexVehicle.findAll({
      where: {
        [Op.or]: [
          { name:      { [Op.like]: `%${shipName}%` } },
          { name_full: { [Op.like]: `%${shipName}%` } },
          { slug:      { [Op.like]: `%${shipName}%` } },
        ]
      }
    });

    if (vehicles.length) {
      if (DEBUG_QUERY) console.log(`[TRADE QUERIES] getVehicleByName → found ${vehicles.length} vehicle(s):`, vehicles.map(v => v.name_full ?? v.name));
    } else {
      console.warn(`[TRADE QUERIES] getVehicleByName → no match found for "${shipName}"`);
    }

    return vehicles;
  } catch (err) {
    console.error(`[TRADE QUERIES] getVehicleByName encountered an error:`, err);
    return [];
  }
}


async function getBuyOptionsAtLocation(locationName) {
  try {
    if (DEBUG_QUERY) console.log(`[TRADE QUERIES] getBuyOptionsAtLocation → locationName="${locationName}"`);
    const results = await UexCommodityPrice.findAll({
      where: { price_buy: { [Op.not]: 0 } },
      include: [{
        model: UexTerminal,
        as: 'terminal',
        required: true,
        where: {
          [Op.or]: [
            { name: locationName },
            { nickname: locationName },
            { city_name: locationName },
            { planet_name: locationName }
          ]
        },
        include: [{ model: UexPoi, as: 'poi' }]
      }]
    });
    if (DEBUG_QUERY) console.log(`[TRADE QUERIES] getBuyOptionsAtLocation → found ${results.length} records`);
    return results;
  } catch (err) {
    console.error(`[TRADE QUERIES] getBuyOptionsAtLocation encountered an error:`, err);
    return [];
  }
}

async function getReturnOptions(fromLocation, toLocation) {
  try {
    if (DEBUG_QUERY) console.log(`[TRADE QUERIES] getReturnOptions → fromLocation="${fromLocation}", toLocation="${toLocation}"`);
    const fromTerminals = await getTerminalsAtLocation(fromLocation);
    if (DEBUG_QUERY) console.log(`[TRADE QUERIES] getReturnOptions → found ${fromTerminals.length} fromTerminals`);
    const fromTerminalNames = fromTerminals.map(t => t.name);

    const records = await UexCommodityPrice.findAll({
      where: { price_buy: { [Op.not]: null }, price_sell: { [Op.not]: null } },
      include: [{
        model: UexTerminal,
        as: 'terminal',
        required: true,
        where: {
          [Op.or]: [
            { name: toLocation },
            { nickname: toLocation },
            { city_name: toLocation },
            { planet_name: toLocation }
          ]
        },
        include: [{ model: UexPoi, as: 'poi' }]
      }]
    });
    if (DEBUG_QUERY) console.log(`[TRADE QUERIES] getReturnOptions → initial records fetched: ${records.length}`);

    const filtered = records.filter(record => fromTerminalNames.includes(record.terminal_name));
    if (DEBUG_QUERY) console.log(`[TRADE QUERIES] getReturnOptions → filtered to ${filtered.length} records matching fromTerminalNames`);
    return filtered;
  } catch (err) {
    console.error(`[TRADE QUERIES] getReturnOptions encountered an error:`, err);
    return [];
  }
}

async function getTerminalsAtLocation(locationName) {
  try {
    if (DEBUG_QUERY) console.log(`[TRADE QUERIES] getTerminalsAtLocation → locationName="${locationName}"`);
    const results = await UexTerminal.findAll({
      where: {
        [Op.or]: [
          { name: locationName },
          { nickname: locationName },
          { city_name: locationName },
          { planet_name: locationName }
        ]
      }
    });
    if (DEBUG_QUERY) console.log(`[TRADE QUERIES] getTerminalsAtLocation → found ${results.length} terminals`);
    return results;
  } catch (err) {
    console.error(`[TRADE QUERIES] getTerminalsAtLocation encountered an error:`, err);
    return [];
  }
}

async function getDistanceBetween(locationA, locationB) {
  if (DEBUG_QUERY) console.log(`[TRADE QUERIES] getDistanceBetween → locationA="${locationA}", locationB="${locationB}" → returning placeholder null`);
  return null;
}

async function getAllShipNames() {
  try {
    if (DEBUG_QUERY) console.log(`[TRADE QUERIES] getAllShipNames → fetching ships`);
    const ships = await UexVehicle.findAll({ attributes: ['name', 'name_full', 'slug'] });
    const names = ships.flatMap(ship => [ship.name, ship.name_full, ship.slug].filter(Boolean));
    if (DEBUG_QUERY) console.log(`[TRADE QUERIES] getAllShipNames → returning ${names.length} names`);
    return names;
  } catch (err) {
    console.error(`[TRADE QUERIES] getAllShipNames encountered an error:`, err);
    return [];
  }
}

async function getSellPricesForCommodityElsewhere(commodityName, excludeLocation) {
  try {
    return await UexCommodityPrice.findAll({
      where: {
        commodity_name: commodityName,
        price_sell: { [Op.not]: null }
      },
      include: [
        {
          model: UexTerminal,
          as: 'terminal',
          required: true,
          where: {
            [Op.or]: [
              { name: { [Op.not]: excludeLocation } },
              { nickname: { [Op.not]: excludeLocation } },
              { city_name: { [Op.not]: excludeLocation } },
              { planet_name: { [Op.not]: excludeLocation } }
            ]
          },
          include: [{ model: UexPoi, as: 'poi' }]
        }
      ]
    });
  } catch (err) {
    console.error(`[TRADE QUERIES] getSellPricesForCommodityElsewhere encountered an error:`, err);
    return [];
  }
}

module.exports = {
  getCommodityTradeOptions,
  getSellOptionsAtLocation,
  getBuyOptionsAtLocation,
  getVehicleByName,
  getAllShipNames,
  getReturnOptions,
  getTerminalsAtLocation,
  getDistanceBetween,
  getSellPricesForCommodityElsewhere
};
