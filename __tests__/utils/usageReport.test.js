jest.mock('../../config/database', () => require('../../__mocks__/config/database'));

const { generateUsageReport } = require('../../utils/usageReport');
const { UsageLog } = require('../../config/database');

describe('generateUsageReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns channel counts', async () => {
    UsageLog.findAll.mockResolvedValue([
      { get: () => ({ channel_id: '1', event_count: 5 }) },
      { get: () => ({ channel_id: '2', event_count: 3 }) },
    ]);

    const res = await generateUsageReport('guild');
    expect(UsageLog.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ server_id: 'guild' }),
      group: ['channel_id'],
    }));
    expect(res).toEqual([
      { channel_id: '1', event_count: 5 },
      { channel_id: '2', event_count: 3 },
    ]);
  });

  test('propagates errors', async () => {
    UsageLog.findAll.mockRejectedValue(new Error('fail'));
    await expect(generateUsageReport('guild')).rejects.toThrow('fail');
  });
});
