const {
  handleTradeBest,
  handleTradeBestCore
} = require('./handlers/best');

const { handleTradeBestCircuit } = require('./handlers/bestCircuit');
const { handleTradeRoute } = require('./handlers/route');
const { handleTradeFind } = require('./handlers/find');
const { handleTradePrice } = require('./handlers/price');
const { handleTradeShip } = require('./handlers/ship');
const { handleTradeLocations } = require('./handlers/locations');
const { handleTradeCommodities } = require('./handlers/commodities');
const { pendingBest } = require('./handlers/shared');

module.exports = {
  handleTradeBest,
  handleTradeRoute,
  handleTradeBestCircuit,
  handleTradeFind,
  handleTradePrice,
  handleTradeShip,
  handleTradeLocations,
  handleTradeCommodities,
  pendingBest
};
