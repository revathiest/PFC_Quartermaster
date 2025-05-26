jest.mock('../../config/database', () => require('../../__mocks__/config/database'));

const { generateReportByChannel } = require('../../utils/reportByChannel');
const { UsageLog } = require('../../config/database');

describe('generateReportByChannel', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns event counts', async () => {
    UsageLog.findAll.mockResolvedValue([
      { get: () => ({ event_type: 'a', event_count: 2 }) },
    ]);

    const res = await generateReportByChannel('guild', 'chan');
    expect(UsageLog.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ server_id: 'guild', channel_id: 'chan' }),
      group: ['event_type'],
    }));
    expect(res).toEqual([{ event_type: 'a', event_count: 2 }]);
  });

  test('propagates errors', async () => {
    UsageLog.findAll.mockRejectedValue(new Error('oops'));
    await expect(generateReportByChannel('g', 'c')).rejects.toThrow('oops');
  });
});
