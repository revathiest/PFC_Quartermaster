const { generateUsageReport } = require('./reports/usageReport');
const { generateVoiceActivityReport } = require('./reports/voiceActivityReport');
const { generateReportByChannel } = require('./reports/reportByChannel');

module.exports = {
    generateUsageReport,
    generateVoiceActivityReport,
    generateReportByChannel
};
