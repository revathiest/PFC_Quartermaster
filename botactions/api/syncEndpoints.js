const { syncManufacturers } = require('../../utils/apiSync/manufacturers');
const { syncVehicles } = require('../../utils/apiSync/vehicles');
const { syncShops } = require('../../utils/apiSync/shops');

async function syncAllEndpoints() {
  const results = [];

  try {
    const manufacturerResult = await syncManufacturers();
    results.push(manufacturerResult);
  } catch (error) {
    results.push({ endpoint: 'manufacturers', success: false, error: error.message });
  }

  try {
    const vehicleResult = await syncVehicles();
    results.push(vehicleResult);
  } catch (error) {
    results.push({ endpoint: 'vehicles', success: false, error: error.message });
  }

  try {
    const shopResult = await syncShops();
    results.push(shopResult);
  } catch (error) {
    results.push({ endpoint: 'shops', success: false, error: error.message });
  }

  return results;
}

module.exports = { 
    syncAllEndpoints,
    syncManufacturers,
    syncVehicles,
    syncShops
};
