const { syncManufacturers } = require('../../utils/apiSync/manufacturers');
const { syncVehicles } = require('../../utils/apiSync/vehicles');
const { syncGalactapedia } = require('../../utils/apiSync/galactapedia');

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
    const galactapediaResult = await syncGalactapedia();
    results.push(galactapediaResult);
  } catch (error) {
    results.push({ endpoint: 'vehicles', success: false, error: error.message });
  }

  return results;
}

module.exports = { 
    syncAllEndpoints,
    syncManufacturers,
    syncVehicles,
    syncGalactapedia
};
