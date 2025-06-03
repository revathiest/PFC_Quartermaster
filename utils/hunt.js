const { Op } = require('sequelize');
const { Hunt } = require('../config/database');

function getHuntStatus(hunt, now = new Date()) {
  if (!hunt.starts_at || !hunt.ends_at) return 'unknown';
  if (now < hunt.starts_at) return 'upcoming';
  if (now > hunt.ends_at) return 'archived';
  return 'active';
}

async function getActiveHunt(now = new Date()) {
  return Hunt.findOne({
    where: {
      starts_at: { [Op.lte]: now },
      ends_at: { [Op.gte]: now }
    },
    order: [['starts_at', 'DESC']]
  });
}

module.exports = { getActiveHunt, getHuntStatus };
