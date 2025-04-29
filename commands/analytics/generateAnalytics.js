const { generateUsageReport } = require('../../utils/usageReport');
const { generateVoiceActivityReport } = require('../../utils/voiceActivityReport');
const { generateReportByChannel } = require('../../utils/reportByChannel');

module.exports = {
    generateUsageReport,
    generateVoiceActivityReport,
    generateReportByChannel
};
