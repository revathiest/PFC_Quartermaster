const { handleVoiceStateUpdate } = require('../../../botactions/eventHandling/voiceEvents');
const { VoiceLog } = require('../../../config/database');
const { getChannelNameById, getUserNameById } = require('../../../botactions/utilityFunctions');

jest.mock('../../../config/database', () => ({
  VoiceLog: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock('../../../botactions/utilityFunctions');

describe('handleVoiceStateUpdate', () => {
  const client = {};

  beforeEach(() => {
    jest.clearAllMocks();
    getChannelNameById.mockResolvedValue('Channel');
    getUserNameById.mockResolvedValue('User');
  });

  function state(channelId) {
    return { id: 'user1', channelId, guild: { id: 'server1' } };
  }

  it('logs join events', async () => {
    const oldState = state(null);
    const newState = state('chan1');

    await handleVoiceStateUpdate(oldState, newState, client);

    expect(VoiceLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user1',
        event_type: 'voice_join',
        channel_id: 'chan1',
        server_id: 'server1',
        start_time: expect.any(Date),
      })
    );
  });

  it('logs leave events', async () => {
    const oldState = state('chan1');
    const newState = state(null);
    VoiceLog.findOne.mockResolvedValue({ timestamp: new Date(Date.now() - 1000) });

    await handleVoiceStateUpdate(oldState, newState, client);

    expect(VoiceLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user1',
        event_type: 'voice_leave',
        channel_id: 'chan1',
        server_id: 'server1',
        duration: expect.any(Number),
        start_time: expect.any(Date),
        end_time: expect.any(Date),
      })
    );
  });

  it('logs move events', async () => {
    const oldState = state('chan1');
    const newState = state('chan2');
    VoiceLog.findOne.mockResolvedValue({ timestamp: new Date(Date.now() - 1000) });

    await handleVoiceStateUpdate(oldState, newState, client);

    expect(VoiceLog.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      event_type: 'voice_leave',
      channel_id: 'chan1',
    }));

    expect(VoiceLog.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
      event_type: 'voice_join',
      channel_id: 'chan2',
    }));
  });

  it('handles channel name fetch errors', async () => {
    getChannelNameById.mockRejectedValue(new Error('fail'));

    const oldState = state(null);
    const newState = state('chan1');

    await handleVoiceStateUpdate(oldState, newState, client);

    expect(VoiceLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        channel_id: 'chan1',
      })
    );
  });

  it('uses null when user lookup fails', async () => {
    getUserNameById.mockRejectedValueOnce(new Error('bad'));

    await handleVoiceStateUpdate(state(null), state('chan1'), client);

    expect(VoiceLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: 'voice_join' })
    );
  });

  it('handles old channel name fetch failure gracefully', async () => {
    getChannelNameById.mockRejectedValueOnce(new Error('old fail'));
    VoiceLog.findOne.mockResolvedValue({ timestamp: new Date(Date.now() - 1000) });

    await handleVoiceStateUpdate(state('chan1'), state(null), client);

    expect(VoiceLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: 'voice_leave' })
    );
  });

  it('logs join when switching without prior join log', async () => {
    VoiceLog.findOne.mockResolvedValue(null);

    await handleVoiceStateUpdate(state('chan1'), state('chan2'), client);

    expect(VoiceLog.create).toHaveBeenCalledTimes(1);
    expect(VoiceLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: 'voice_join', channel_id: 'chan2' })
    );
  });
});
