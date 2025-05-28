jest.mock('../../../services/audioManager', () => ({
  getQueue: jest.fn()
}));

const audioManager = require('../../../services/audioManager');
const queue = require('../../../commands/music/queue');
const { MockInteraction } = require('discord.js');

describe('queue command', () => {
  test('shows empty message when no tracks', async () => {
    audioManager.getQueue.mockReturnValue([]);
    const interaction = new MockInteraction({ guild: { id: 'g1' } });
    jest.spyOn(interaction, 'reply');
    await queue.execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith({ content: 'Queue is empty.' });
  });

  test('renders embed with tracks', async () => {
    audioManager.getQueue.mockReturnValue([{ info: { title: 'Song' } }]);
    const interaction = new MockInteraction({ guild: { id: 'g1' } });
    jest.spyOn(interaction, 'reply');
    await queue.execute(interaction);
    const embed = interaction.reply.mock.calls[0][0].embeds[0].toJSON();
    expect(embed.title).toBe('Music Queue');
    expect(embed.description).toContain('Song');
  });
});
