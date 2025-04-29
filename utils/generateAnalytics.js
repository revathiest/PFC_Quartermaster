const { generateUsageReport } = require('./usageReport');
const { generateVoiceActivityReport } = require('./voiceActivityReport');
const { generateReportByChannel } = require('./reportByChannel');

module.exports = {
    generateUsageReport,
    generateVoiceActivityReport,
    generateReportByChannel
};
