const { syncManufacturers } = require('../../utils/apiSync/manufacturers');

async function syncAllEndpoints() {
  const results = [];

  try {
    const manufacturerResult = await syncManufacturers();
    results.push(manufacturerResult);
  } catch (error) {
    results.push({ endpoint: 'manufacturers', success: false, error: error.message });
  }

  return results;
}

module.exports = { syncAllEndpoints };
