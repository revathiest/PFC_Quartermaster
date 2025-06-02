jest.mock('../../../botactions/eventHandling/interactionEvents/buildOptionsSummary', () => ({ buildOptionsSummary: jest.fn(() => 'summary') }));
jest.mock('../../../botactions/eventHandling/interactionEvents/logInteraction', () => ({ logInteraction: jest.fn() }));
jest.mock('../../../botactions/commandHandling/channelSelector', () => ({ createChannelSelectMenu: jest.fn(() => 'menu') }));

const { buildOptionsSummary } = require('../../../botactions/eventHandling/interactionEvents/buildOptionsSummary');
const { logInteraction } = require('../../../botactions/eventHandling/interactionEvents/logInteraction');
const { createChannelSelectMenu } = require('../../../botactions/commandHandling/channelSelector');
const { MessageFlags } = require('../../../__mocks__/discord.js');
const { pendingChannelSelection } = require('../../../utils/pendingSelections');
const { handleInteraction } = require('../../../botactions/eventHandling/interactionEvents');

beforeEach(() => {
  jest.clearAllMocks();
  for (const key in pendingChannelSelection) delete pendingChannelSelection[key];
});

describe('handleInteraction', () => {
  test('logs error on null interaction', async () => {
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    await handleInteraction(null, {});
    expect(err).toHaveBeenCalledWith('❌ Interaction is null or undefined');
    err.mockRestore();
  });

  test('handles command interactions', async () => {
    const execute = jest.fn();
    const client = { commands: new Map([['test', { execute }]]) };
    const interaction = {
      isCommand: () => true,
      isButton: () => false,
      isStringSelectMenu: () => false,
      isModalSubmit: () => false,
      commandName: 'test',
      guild: { id: 'g1' }
    };
    await handleInteraction(interaction, client);
    expect(buildOptionsSummary).toHaveBeenCalledWith(interaction);
    expect(logInteraction).toHaveBeenCalledWith(expect.objectContaining({ type: 'command', commandName: 'test', serverId: 'g1', optionsSummary: 'summary' }));
    expect(execute).toHaveBeenCalledWith(interaction, client);
  });

  test('handles button interactions', async () => {
    const button = jest.fn();
    const client = { commands: new Map([['foo', { data: { name: 'foo' }, button }]]) };
    const interaction = {
      isCommand: () => false,
      isButton: () => true,
      isStringSelectMenu: () => false,
      isModalSubmit: () => false,
      customId: 'foo::btn',
      message: { interaction: { commandName: 'foo' } },
      guild: { id: 'g1' },
      replied: false,
      deferred: false,
      reply: jest.fn()
    };
    await handleInteraction(interaction, client);
    expect(button).toHaveBeenCalledWith(interaction, client);
    expect(logInteraction).toHaveBeenCalledWith(expect.objectContaining({ type: 'button', commandName: 'foo' }));
  });

  test('handles select menu interactions', async () => {
    const option = jest.fn();
    const client = { commands: new Map([['foo', { data: { name: 'foo' }, option }]]) };
    const interaction = {
      isCommand: () => false,
      isButton: () => false,
      isStringSelectMenu: () => true,
      isModalSubmit: () => false,
      customId: 'foo::select',
      values: ['A'],
      guild: { id: 'g1' },
      replied: false,
      deferred: false,
      reply: jest.fn()
    };
    await handleInteraction(interaction, client);
    expect(option).toHaveBeenCalledWith(interaction, client);
    expect(logInteraction).toHaveBeenCalledWith(expect.objectContaining({ type: 'select_menu', commandName: 'foo', optionsSummary: 'selected: [A]' }));
  });

  test('handles modal submission with scheduleModal', async () => {
    const interaction = {
      isCommand: () => false,
      isButton: () => false,
      isStringSelectMenu: () => false,
      isModalSubmit: () => true,
      customId: 'scheduleModal',
      user: { id: 'u1' },
      guild: {},
      fields: { getTextInputValue: jest.fn(key => ({ title:'t', description:'d', time:'in 1 minute' }[key])) },
      reply: jest.fn()
    };
    await handleInteraction(interaction, { commands: new Map() });
    expect(createChannelSelectMenu).toHaveBeenCalled();
    expect(pendingChannelSelection.u1.title).toBe('t');
    expect(interaction.reply).toHaveBeenCalledWith({ content: '📢 Please select a channel:', components: ['menu'], flags: MessageFlags.Ephemeral });
  });

  test('dispatches to command modal handler', async () => {
    const modal = jest.fn();
    const client = { commands: new Map([['foo', { data: { name: 'foo' }, modal }]]) };
    const interaction = {
      isCommand: () => false,
      isButton: () => false,
      isStringSelectMenu: () => false,
      isModalSubmit: () => true,
      customId: 'foo::step',
      guild: { id: 'g1' },
      replied: false,
      deferred: false,
      fields: { getTextInputValue: jest.fn() },
      reply: jest.fn()
    };

    await handleInteraction(interaction, client);

    expect(modal).toHaveBeenCalledWith(interaction, client);
  });

  test('replies when command not found', async () => {
    const interaction = {
      isCommand: () => true,
      isButton: () => false,
      isStringSelectMenu: () => false,
      isModalSubmit: () => false,
      commandName: 'missing',
      guild: { id: 'g1' },
      reply: jest.fn()
    };
    await handleInteraction(interaction, { commands: new Map() });
    expect(interaction.reply).toHaveBeenCalledWith('❌ Unable to find command...');
  });

  test('checks roles before executing command', async () => {
    const execute = jest.fn();
    const client = { commands: new Map([['test', { execute, roles: ['Admin'], data: { name: 'test' } }]]) };
    const interaction = {
      isCommand: () => true,
      isButton: () => false,
      isStringSelectMenu: () => false,
      isModalSubmit: () => false,
      commandName: 'test',
      guild: { id: 'g1' },
      member: { roles: { cache: { some: cb => cb({ name: 'User' }) } } },
      reply: jest.fn()
    };
    await handleInteraction(interaction, client);
    expect(execute).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({ content: "You don't have the required role to use this command.", flags: MessageFlags.Ephemeral });
  });

  test('handles command execution errors', async () => {
    const execute = jest.fn().mockRejectedValue(new Error('boom'));
    const client = { commands: new Map([['test', { execute, data: { name: 'test' } }]]) };
    const interaction = {
      isCommand: () => true,
      isButton: () => false,
      isStringSelectMenu: () => false,
      isModalSubmit: () => false,
      commandName: 'test',
      guild: { id: 'g1' },
      replied: false,
      deferred: false,
      reply: jest.fn(),
      editReply: jest.fn()
    };
    await handleInteraction(interaction, client);
    expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ There was an error while executing this command!', flags: MessageFlags.Ephemeral });
  });

  test('replies when button handler missing', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const client = { commands: new Map([['foo', { data: { name: 'foo' } }]]) };
    const interaction = {
      isCommand: () => false,
      isButton: () => true,
      isStringSelectMenu: () => false,
      isModalSubmit: () => false,
      customId: 'foo::btn',
      message: { interaction: { commandName: 'foo' } },
      guild: { id: 'g1' },
      replied: false,
      deferred: false,
      reply: jest.fn()
    };

    await handleInteraction(interaction, client);
    expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ Button handler not found.', flags: MessageFlags.Ephemeral });
    warn.mockRestore();
  });

  test('handles button handler errors gracefully', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const button = jest.fn().mockRejectedValue(new Error('fail'));
    const client = { commands: new Map([['foo', { data: { name: 'foo' }, button }]]) };
    const interaction = {
      isCommand: () => false,
      isButton: () => true,
      isStringSelectMenu: () => false,
      isModalSubmit: () => false,
      customId: 'foo::btn',
      message: { interaction: { commandName: 'foo' } },
      guild: { id: 'g1' },
      replied: false,
      deferred: false,
      reply: jest.fn()
    };

    await handleInteraction(interaction, client);
    expect(error).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ Something went wrong.', flags: MessageFlags.Ephemeral });
    error.mockRestore();
  });

  test('replies when select menu handler missing', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const client = { commands: new Map([['foo', { data: { name: 'foo' } }]]) };
    const interaction = {
      isCommand: () => false,
      isButton: () => false,
      isStringSelectMenu: () => true,
      isModalSubmit: () => false,
      customId: 'foo::select',
      values: ['A'],
      guild: { id: 'g1' },
      replied: false,
      deferred: false,
      reply: jest.fn()
    };

    await handleInteraction(interaction, client);
    expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ Select menu handler not found.', flags: MessageFlags.Ephemeral });
    warn.mockRestore();
  });

  test('handles select menu handler errors gracefully', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const option = jest.fn().mockRejectedValue(new Error('fail'));
    const client = { commands: new Map([['foo', { data: { name: 'foo' }, option }]]) };
    const interaction = {
      isCommand: () => false,
      isButton: () => false,
      isStringSelectMenu: () => true,
      isModalSubmit: () => false,
      customId: 'foo::select',
      values: ['A'],
      guild: { id: 'g1' },
      replied: false,
      deferred: false,
      reply: jest.fn()
    };

    await handleInteraction(interaction, client);
    expect(error).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ Something went wrong.', flags: MessageFlags.Ephemeral });
    error.mockRestore();
  });

  test('modal submission rejects invalid time', async () => {
    const interaction = {
      isCommand: () => false,
      isButton: () => false,
      isStringSelectMenu: () => false,
      isModalSubmit: () => true,
      customId: 'scheduleModal',
      user: { id: 'u2' },
      guild: {},
      fields: { getTextInputValue: jest.fn(() => 'not a time') },
      replied: false,
      deferred: false,
      reply: jest.fn()
    };

    await handleInteraction(interaction, { commands: new Map() });
    expect(createChannelSelectMenu).not.toHaveBeenCalled();
    expect(pendingChannelSelection.u2).toBeUndefined();
    expect(interaction.reply).toHaveBeenCalledWith({
      content: '❌ Could not understand that time. Try something like "tomorrow at 5pm" or "in 15 minutes".',
      flags: MessageFlags.Ephemeral
    });
  });

  test('button command uses customId when message lacks commandName', async () => {
    const button = jest.fn();
    const client = { commands: new Map([['foo', { data: { name: 'foo' }, button }]]) };
    const interaction = {
      isCommand: () => false,
      isButton: () => true,
      isStringSelectMenu: () => false,
      isModalSubmit: () => false,
      customId: 'foo::btn',
      message: { interaction: {} },
      guild: { id: 'g1' },
      replied: false,
      deferred: false,
      reply: jest.fn()
    };
    await handleInteraction(interaction, client);
    expect(button).toHaveBeenCalledWith(interaction, client);
    expect(logInteraction).toHaveBeenCalledWith(expect.objectContaining({ commandName: 'foo' }));
  });

  test('logs unsupported interaction type', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const interaction = {
      isCommand: () => false,
      isButton: () => false,
      isStringSelectMenu: () => false,
      isModalSubmit: () => false,
      guild: {}
    };
    await handleInteraction(interaction, { commands: new Map() });
    expect(logSpy).toHaveBeenCalledWith('⚠️ Received an unsupported interaction type.');
    logSpy.mockRestore();
  });

  test('executes command when command is a function', async () => {
    const cmdFn = jest.fn();
    const client = { commands: new Map([['foo', cmdFn]]) };
    const interaction = {
      isCommand: () => true,
      isButton: () => false,
      isStringSelectMenu: () => false,
      isModalSubmit: () => false,
      commandName: 'foo',
      guild: { id: 'g1' }
    };
    await handleInteraction(interaction, client);
    expect(cmdFn).toHaveBeenCalledWith(interaction);
  });

  test('edits reply when command error occurs after reply', async () => {
    const execute = jest.fn().mockRejectedValue(new Error('boom'));
    const client = { commands: new Map([['foo', { execute }]]) };
    const interaction = {
      isCommand: () => true,
      isButton: () => false,
      isStringSelectMenu: () => false,
      isModalSubmit: () => false,
      commandName: 'foo',
      guild: { id: 'g1' },
      replied: true,
      deferred: false,
      reply: jest.fn(),
      editReply: jest.fn()
    };
    await handleInteraction(interaction, client);
    expect(interaction.editReply).toHaveBeenCalledWith({ content: '❌ There was an error while executing this command!' });
  });

  test('modal submit with unknown id replies with handler not found', async () => {
    const interaction = {
      isCommand: () => false,
      isButton: () => false,
      isStringSelectMenu: () => false,
      isModalSubmit: () => true,
      customId: 'other',
      user: { id: 'u3' },
      guild: {},
      fields: { getTextInputValue: jest.fn() },
      reply: jest.fn()
    };
    await handleInteraction(interaction, { commands: new Map() });
    expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ Modal handler not found.', flags: MessageFlags.Ephemeral });
  });
});
