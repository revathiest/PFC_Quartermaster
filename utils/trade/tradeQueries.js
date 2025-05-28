const DEBUG_QUERY = false;

const { Op } = require('sequelize');
const { UexCommodityPrice, UexTerminal, UexPoi, UexVehicle } = require('../../config/database');

async function getCommodityTradeOptions(commodityName) {
  try {
    const results = await UexCommodityPrice.findAll({
      where: { commodity_name: commodityName },
      include: [{ model: UexTerminal, as: 'terminal', required: true, include: [{ model: UexPoi, as: 'poi' }] }]
    });
    return results;
  } catch (err) {
    console.error(`[TRADE QUERIES] getCommodityTradeOptions encountered an error:`, err);
    return [];
  }
}

async function getSellOptionsAtLocation(locationName) {
  try {
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
    return results;
  } catch (err) {
    console.error(`[TRADE QUERIES] getSellOptionsAtLocation encountered an error:`, err);
    return [];
  }
}

async function getVehicleByName(shipName) {
  try {

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
    return results;
  } catch (err) {
    console.error(`[TRADE QUERIES] getBuyOptionsAtLocation encountered an error:`, err);
    return [];
  }
}

async function getReturnOptions(fromLocation, toLocation) {
  try {
    const fromTerminals = await getTerminalsAtLocation(fromLocation);
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

    const filtered = records.filter(record => fromTerminalNames.includes(record.terminal_name));
    return filtered;
  } catch (err) {
    console.error(`[TRADE QUERIES] getReturnOptions encountered an error:`, err);
    return [];
  }
}

async function getTerminalsAtLocation(locationName) {
  try {
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
    return results;
  } catch (err) {
    console.error(`[TRADE QUERIES] getTerminalsAtLocation encountered an error:`, err);
    return [];
  }
}

async function getDistanceBetween(locationA, locationB) {
  return null;
}

async function getAllShipNames() {
  try {
    const ships = await UexVehicle.findAll({ attributes: ['name', 'name_full', 'slug'] });
    const names = ships.flatMap(ship => [ship.name, ship.name_full, ship.slug].filter(Boolean));
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
