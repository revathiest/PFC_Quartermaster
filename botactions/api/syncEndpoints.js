const { syncManufacturers } = require('../../utils/apiSync/manufacturers');
const { syncVehicles } = require('../../utils/apiSync/vehicles');
const { syncGalactapedia } = require('../../utils/apiSync/galactapedia');
const { syncUexVehicles } = require('../../utils/apiSync/syncUexVehicles');
const { syncUexTerminals } = require('../../utils/apiSync/syncUexTerminals');
const { syncUexItemPrices } = require('../../utils/apiSync/syncUexItemPrices');
const { syncUexCategories } = require('../../utils/apiSync/syncUexCategories');

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
    results.push({ endpoint: 'galactapedia', success: false, error: error.message });
  }

  try{
    const  syncUexVehicleResult = await syncUexVehicles();
    results.push(syncUexVehicleResult);
  } catch (error) {
    results.push({ endpoint: 'vehicles', success: false, error: error.message });
  }

  try{
    const  syncUexTerminalResult = await syncUexTerminals();
    results.push(syncUexTerminalResult);
  } catch (error) {
    results.push({ endpoint: 'terminals', success: false, error: error.message });
  }

  try {
    const syncUexItemPriceResult = await syncUexItemPrices();
    results.push(syncUexItemPriceResult);
  }catch (error){
    results.push({endpoint: 'items_prices_all', success: false, erro: error.message });
  }

  try {
    const syncUexCategoryResult = await syncUexCategories();
    results.push(syncUexCategoryResult);
  }catch (error){
    results.push({endpoint: 'categories', success: false, erro: error.message });
  }

  return results;
}

module.exports = { 
    syncAllEndpoints,
    syncManufacturers,
    syncVehicles,
    syncGalactapedia,
    syncUexVehicles,
    syncUexTerminals,
    syncUexItemPrices,
    syncUexCategories
};
