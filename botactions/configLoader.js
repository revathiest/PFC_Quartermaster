const fs = require('fs'); 
const { getConfigFromDatabase, saveConfigToDatabase } = require('./databaseHandler');

// Function to load config from file (fallback)
const loadConfigFromFile = () => {
    console.log('Loading configuration from file...');
    const rawData = fs.readFileSync('./config.json');
    const configFile = JSON.parse(rawData);
    console.log('Configuration successfully loaded from file');
    return configFile;
};

const loadConfiguration = async () => {
    // Load configuration from database
    let config;
    try {
        console.log('Attempting to load configuration from database...');
        config = await getConfigFromDatabase();
        if (Object.keys(config).length === 0) {
            console.log('No configuration found in database, loading from file...');
            config = loadConfigFromFile();
            await saveConfigToDatabase(config);
        } else {
            console.log('Configuration successfully loaded from database');
        }
    } catch (error) {
        console.error('Error loading configuration from database, falling back to file...');
        config = loadConfigFromFile();
        await saveConfigToDatabase(config);
    }
    return config;
};

module.exports = {
    loadConfigFromFile, 
    loadConfiguration
}