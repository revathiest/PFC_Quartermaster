const fs = require('fs');
const path = require('path');

const loadConfiguration = () => {
  console.log('🛠️ Loading configuration from config.json...');
  const rawData = fs.readFileSync(path.join(__dirname, '../config.json'));
  const configFile = JSON.parse(rawData);
  console.log('✅ Configuration loaded successfully.');
  return configFile;
};

module.exports = {
  loadConfiguration,
};
