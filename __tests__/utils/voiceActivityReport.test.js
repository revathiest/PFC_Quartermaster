jest.mock('../../config/database', () => require('../../__mocks__/config/database'));

const { generateVoiceActivityReport } = require('../../utils/voiceActivityReport');
const { VoiceLog } = require('../../config/database');

describe('generateVoiceActivityReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2021-01-01T01:30:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('computes stats for voice events', async () => {
    VoiceLog.findAll
      .mockResolvedValueOnce([
        { get: () => ({ channel_id: 'c', user_id: 'u', timestamp: new Date('2021-01-01T00:00:00Z') }) },
        { get: () => ({ channel_id: 'c', user_id: 'u', timestamp: new Date('2021-01-01T01:00:00Z') }) },
      ])
      .mockResolvedValueOnce([
        { get: () => ({ channel_id: 'c', user_id: 'u', timestamp: new Date('2021-01-01T00:10:00Z') }) },
      ]);

    const res = await generateVoiceActivityReport('guild');

    expect(VoiceLog.findAll).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: expect.objectContaining({ server_id: 'guild', event_type: 'voice_join' })
    }));
    expect(VoiceLog.findAll).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: expect.objectContaining({ server_id: 'guild', event_type: 'voice_leave' })
    }));
    expect(res).toEqual([
      {
        channel_id: 'c',
        peak_users: 1,
        average_users: 1,
        total_duration: '00:40:00'
      }
    ]);
  });
});
