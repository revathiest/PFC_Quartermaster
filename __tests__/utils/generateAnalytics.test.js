jest.mock('../../utils/usageReport', () => ({ generateUsageReport: jest.fn(() => 'u') }));
jest.mock('../../utils/voiceActivityReport', () => ({ generateVoiceActivityReport: jest.fn(() => 'v') }));
jest.mock('../../utils/reportByChannel', () => ({ generateReportByChannel: jest.fn(() => 'c') }));

const analytics = require('../../utils/generateAnalytics');
const { generateUsageReport } = require('../../utils/usageReport');
const { generateVoiceActivityReport } = require('../../utils/voiceActivityReport');
const { generateReportByChannel } = require('../../utils/reportByChannel');

describe('generateAnalytics module', () => {
  test('re-exports reporting helpers', () => {
    expect(analytics.generateUsageReport()).toBe('u');
    expect(analytics.generateVoiceActivityReport()).toBe('v');
    expect(analytics.generateReportByChannel()).toBe('c');
    expect(generateUsageReport).toHaveBeenCalled();
    expect(generateVoiceActivityReport).toHaveBeenCalled();
    expect(generateReportByChannel).toHaveBeenCalled();
  });
});
