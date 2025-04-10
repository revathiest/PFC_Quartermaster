const { fetchUexData } = require('../../utils/fetchUexData');
const { UexItemPrice } = require('../../models');
async function syncUexItemPrices(sequelize) {
  try {
    const response = await fetchUexData('/items_prices_all');
    const records = response?.data;

    if (!Array.isArray(records)) {
      throw new Error('Invalid data structure from items_prices_all');
    }

    const upsertPromises = records.map(record => {
      return UexItemPrice.upsert(record);
    });

    await Promise.all(upsertPromises);

    console.log(`✅ Synced ${records.length} item price records.`);
    return { success: true, count: records.length };
  } catch (error) {
    console.error('❌ Failed to sync UEX item prices:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { syncUexItemPrices };
