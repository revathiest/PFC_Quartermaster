jest.mock('../../../services/audioManager', () => ({
  enqueue: jest.fn(),
  join: jest.fn()
}));

const audioManager = require('../../../services/audioManager');
const play = require('../../../commands/music/play');
const { MockInteraction } = require('discord.js');

describe('play command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('queues track and replies', async () => {
    const interaction = new MockInteraction({ options: { query: 'test' }, guild: { id: 'g1', voiceAdapterCreator: jest.fn() }, member: { voice: { channelId: 'c1' } } });
    jest.spyOn(interaction, 'deferReply');
    jest.spyOn(interaction, 'editReply');

    await play.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(audioManager.join).toHaveBeenCalledWith('g1', 'c1', interaction.guild.voiceAdapterCreator);
    expect(audioManager.enqueue).toHaveBeenCalledWith('g1', 'test');
    expect(interaction.editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Queued') }));
  });

  test('handles enqueue failure', async () => {
    const interaction = new MockInteraction({ options: { query: 'fail' }, guild: { id: 'g1', voiceAdapterCreator: jest.fn() }, member: { voice: { channelId: 'c1' } } });
    jest.spyOn(interaction, 'deferReply');
    jest.spyOn(interaction, 'editReply');
    audioManager.enqueue.mockRejectedValue(new Error('bad'));

    await play.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith(expect.stringContaining('❌'));
  });

  test('requires voice channel', async () => {
    const interaction = new MockInteraction({ options: { query: 'q' }, guild: { id: 'g1' }, member: { voice: { channelId: null } } });
    jest.spyOn(interaction, 'deferReply');
    jest.spyOn(interaction, 'editReply');

    await play.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith(expect.stringContaining('❌'));
    expect(audioManager.join).not.toHaveBeenCalled();
  });
});
