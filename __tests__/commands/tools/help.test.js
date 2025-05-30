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
