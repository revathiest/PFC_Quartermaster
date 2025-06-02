const help = require('../../../commands/tools/help');
const { ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField, MessageFlags } = require('../../../__mocks__/discord.js');

const makeInteraction = () => {
  const permissions = { has: jest.fn(() => true) };
  return {
    member: { permissions },
    deferReply: jest.fn(),
    followUp: jest.fn().mockResolvedValue({ createMessageComponentCollector: jest.fn(() => ({ on: jest.fn() })) }),
  };
};

test('builds help menu from commands', async () => {
  const interaction = makeInteraction();

  const commands = new Map();
  commands.set('a', { data: { name: 'a', default_member_permissions: PermissionsBitField.Flags.SendMessages }, help: 'desc', category: 'Fun' });
  commands.set('b', { data: { name: 'b' }, help: 'other', category: 'Misc' });

  const client = { commands };
  await help.execute(interaction, client);

  expect(interaction.deferReply).toHaveBeenCalledWith({ flags: MessageFlags.Ephemeral });
  expect(interaction.followUp).toHaveBeenCalled();
});

test('option ignores unrelated custom id', async () => {
  const spy = jest.fn();
  await help.option({ customId: 'other', reply: spy });
  expect(spy).not.toHaveBeenCalled();
});

test('collector end disables components', async () => {
  const permissions = { has: jest.fn(() => true) };
  const edit = jest.fn();
  const interaction = {
    member: { permissions },
    deferReply: jest.fn(),
    followUp: jest.fn().mockResolvedValue({
      edit,
      deleted: false,
      editable: true,
      createMessageComponentCollector: jest.fn(() => ({
        on: (evt, cb) => evt === 'end' && cb()
      }))
    })
  };

  const client = { commands: new Map([['a', { data: { name: 'a' }, help: 'h' }]]) };

  await help.execute(interaction, client);

  expect(edit).toHaveBeenCalled();
});


test('collector rejects other user', async () => {
  const permissions = { has: jest.fn(() => true) };
  const events = {};
  const interaction = {
    user: { id: '1' },
    member: { permissions },
    deferReply: jest.fn(),
    followUp: jest.fn().mockResolvedValue({
      createMessageComponentCollector: jest.fn(() => ({ on: (e, cb) => { events[e] = cb; } }))
    })
  };
  const client = { commands: new Map([['a', { data: { name: 'a', default_member_permissions: PermissionsBitField.Flags.SendMessages }, help: 'h', category: 'Fun' }]]) };
  await help.execute(interaction, client);
  const reply = { user: { id: '2' }, reply: jest.fn() };
  await events.collect(reply);
  expect(reply.reply).toHaveBeenCalledWith({ content: 'This menu isn’t for you.', flags: MessageFlags.Ephemeral });
});

test('collector updates selected category', async () => {
  const permissions = { has: jest.fn(() => true) };
  const events = {};
  const interaction = {
    user: { id: '1' },
    member: { permissions },
    deferReply: jest.fn(),
    followUp: jest.fn().mockResolvedValue({
      createMessageComponentCollector: jest.fn(() => ({ on: (e, cb) => { events[e] = cb; } }))
    })
  };
  const client = { commands: new Map([['a', { data: { name: 'a', default_member_permissions: PermissionsBitField.Flags.SendMessages }, help: 'h', category: 'Fun' }]]) };
  await help.execute(interaction, client);
  const update = jest.fn();
  await events.collect({ user: { id: '1' }, values: ['Fun'], update });
  expect(update).toHaveBeenCalled();
});

test('filters commands by permission and help text', async () => {
  const { PermissionFlagsBits } = require('../../../__mocks__/discord.js');
  const permissions = { has: jest.fn(id => id !== PermissionFlagsBits.ManageGuild) };
  const interaction = {
    member: { permissions },
    deferReply: jest.fn(),
    followUp: jest.fn().mockResolvedValue({ createMessageComponentCollector: jest.fn(() => ({ on: jest.fn() })) })
  };

  const commands = new Map();
  commands.set('a', { data: { name: 'a', default_member_permissions: PermissionFlagsBits.ManageGuild }, help: 'desc', category: 'Admin' });
  commands.set('b', { data: { name: 'b' }, help: 123, category: 'Misc' });
  commands.set('c', { data: { name: 'c' }, help: 'valid', category: 'Misc' });

  const client = { commands };
  await help.execute(interaction, client);

  const options = interaction.followUp.mock.calls[0][0].components[0].addComponents.mock.calls[0][0].data.options;
  const labels = options.map(o => o.label);
  expect(labels).toEqual(['Misc']);
});

test('collector end handles deleted message gracefully', async () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  const permissions = { has: jest.fn(() => true) };
  const interaction = {
    member: { permissions },
    deferReply: jest.fn(),
    followUp: jest.fn().mockResolvedValue({
      deleted: true,
      editable: false,
      createMessageComponentCollector: jest.fn(() => ({ on: (evt, cb) => evt === 'end' && cb() }))
    })
  };
  const client = { commands: new Map([['a', { data: { name: 'a' }, help: 'h' }]]) };
  await help.execute(interaction, client);
  expect(console.warn).toHaveBeenCalled();
});

test('collector end logs errors', async () => {
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const permissions = { has: jest.fn(() => true) };
  const interaction = {
    member: { permissions },
    deferReply: jest.fn(),
    followUp: jest.fn().mockResolvedValue({
      edit: jest.fn().mockRejectedValue({ code: 10008 }),
      deleted: false,
      editable: true,
      createMessageComponentCollector: jest.fn(() => ({ on: (evt, cb) => evt === 'end' && cb() }))
    })
  };
  const client = { commands: new Map([['a', { data: { name: 'a' }, help: 'h' }]]) };
  await help.execute(interaction, client);
  expect(warnSpy).toHaveBeenCalled();

  const interaction2 = {
    member: { permissions },
    deferReply: jest.fn(),
    followUp: jest.fn().mockResolvedValue({
      edit: jest.fn().mockRejectedValue(new Error('fail')),
      deleted: false,
      editable: true,
      createMessageComponentCollector: jest.fn(() => ({ on: (evt, cb) => evt === 'end' && cb() }))
    })
  };
  await help.execute(interaction2, client);
  expect(errorSpy).toHaveBeenCalled();
});
