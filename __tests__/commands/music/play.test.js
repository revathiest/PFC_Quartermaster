jest.mock('../../../services/audioManager', () => ({
  enqueue: jest.fn()
}));

const audioManager = require('../../../services/audioManager');
const play = require('../../../commands/music/play');
const { MockInteraction } = require('discord.js');

describe('play command', () => {
  test('queues track and replies', async () => {
    const interaction = new MockInteraction({ options: { query: 'test' }, guild: { id: 'g1' } });
    jest.spyOn(interaction, 'deferReply');
    jest.spyOn(interaction, 'editReply');

    await play.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalled();
    expect(audioManager.enqueue).toHaveBeenCalledWith('g1', 'test');
    expect(interaction.editReply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Queued') }));
  });
});
