const { Transaction, Configuration } = require('../config/database'); // Import models

// Function to store a transaction
async function storeTransaction(userId, amount) {
    try {
        const transaction = await Transaction.create({ userId, amount });
        console.log('Transaction stored:', transaction);
    } catch (error) {
        console.error('Error storing transaction:', error);
    }
}

// Function to get a configuration value
async function getConfig(key) {
    try {
        const config = await Configuration.findOne({ where: { key } });
        return config ? config.value : null;
    } catch (error) {
        console.error('Error fetching configuration:', error);
    }
}

module.exports = {
    storeTransaction,
    getConfig
};
