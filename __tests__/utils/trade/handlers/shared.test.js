const { MessageFlags } = require('discord.js');
const { safeReply } = require('../../../../utils/trade/handlers/shared');

describe('safeReply', () => {
  const createInteraction = (overrides = {}) => {
    return {
      replied: false,
      deferred: false,
      reply: jest.fn(function(payload){
        this.replied = true;
        return Promise.resolve(payload);
      }),
      editReply: jest.fn(function(payload){
        this.replied = true;
        return Promise.resolve(payload);
      }),
      ...overrides
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initial reply uses reply with ephemeral flag', async () => {
    const interaction = createInteraction();
    await safeReply(interaction, { content: 'hi' });

    expect(interaction.reply).toHaveBeenCalledWith({ content: 'hi', flags: MessageFlags.Ephemeral });
    expect(interaction.editReply).not.toHaveBeenCalled();
  });

  test('subsequent calls use editReply and clear embeds/components', async () => {
    const interaction = createInteraction();
    await safeReply(interaction, { content: 'first' });
    interaction.reply.mockClear();

    await safeReply(interaction, { content: 'update' });

    expect(interaction.editReply).toHaveBeenCalledWith({
      content: 'update',
      flags: MessageFlags.Ephemeral,
      embeds: [],
      components: []
    });
    expect(interaction.reply).not.toHaveBeenCalled();
  });

  test('accepts string payloads and wraps with content', async () => {
    const interaction = createInteraction();
    await safeReply(interaction, 'hello');

    expect(interaction.reply).toHaveBeenCalledWith({ content: 'hello', flags: MessageFlags.Ephemeral });
  });

  test('errors are caught and logged without throwing', async () => {
    const interaction = createInteraction();
    interaction.reply.mockImplementation(() => { throw new Error('boom'); });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(safeReply(interaction, { content: 'oops' })).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});
