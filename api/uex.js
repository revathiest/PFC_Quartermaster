const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const {
  UexTerminal,
  UexItemPrice,
  UexCommodityPrice,
  UexFuelPrice,
  UexVehiclePurchasePrice,
  UexVehicleRentalPrice
} = require('../config/database');

async function searchTerminals(req, res) {
  const { name, location } = req.query;
  const filters = [];

  if (name) {
    filters.push({ name: { [Op.like]: `%${name}%` } });
  }

  if (location) {
    const pattern = { [Op.like]: `%${location}%` };
    filters.push({
      [Op.or]: [
        { star_system_name: pattern },
        { planet_name: pattern },
        { orbit_name: pattern },
        { space_station_name: pattern },
        { outpost_name: pattern },
        { city_name: pattern }
      ]
    });
  }

  try {
    const terminals = await UexTerminal.findAll({
      where: filters.length ? { [Op.and]: filters } : undefined
    });
    res.json({ terminals });
  } catch (err) {
    console.error('Failed to search terminals:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getTerminalInventory(req, res) {
  const { id } = req.params;
  try {
    const terminal = await UexTerminal.findByPk(id);
    if (!terminal) return res.status(404).json({ error: 'Not found' });

    const [items, commodities, fuel, vehicleBuy, vehicleRent] = await Promise.all([
      UexItemPrice.findAll({ where: { id_terminal: id } }),
      UexCommodityPrice.findAll({ where: { id_terminal: id } }),
      UexFuelPrice.findAll({ where: { id_terminal: id } }),
      UexVehiclePurchasePrice.findAll({ where: { id_terminal: id } }),
      UexVehicleRentalPrice.findAll({ where: { id_terminal: id } })
    ]);

    res.json({
      terminal,
      inventory: {
        items,
        commodities,
        fuel,
        vehicles_buy: vehicleBuy,
        vehicles_rent: vehicleRent
      }
    });
  } catch (err) {
    console.error('Failed to load terminal inventory:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

router.get('/terminals', searchTerminals);
router.get('/terminals/:id', getTerminalInventory);

module.exports = { router, searchTerminals, getTerminalInventory };
