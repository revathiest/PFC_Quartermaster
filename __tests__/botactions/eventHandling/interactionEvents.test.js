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
});
