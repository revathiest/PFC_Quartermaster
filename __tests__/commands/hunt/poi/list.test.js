jest.mock('../../../../config/database', () => ({
  HuntPoi: { findAll: jest.fn(), findByPk: jest.fn() }
}));

const { HuntPoi } = require('../../../../config/database');
const command = require('../../../../commands/hunt/poi/list');
const { MessageFlags } = require('../../../../__mocks__/discord.js');

const makeInteraction = (roles = []) => ({
  reply: jest.fn(),
  editReply: jest.fn(),
  member: {
    roles: {
      cache: {
        map: (fn) => roles.map(r => fn({ name: r }))
      }
    }
  }
});

beforeEach(() => jest.clearAllMocks());

test('replies when no pois exist', async () => {
  HuntPoi.findAll.mockResolvedValue([]);
  const interaction = makeInteraction();

  await command.execute(interaction);

  expect(interaction.reply).toHaveBeenCalledWith({
    content: '❌ No POIs found.',
    flags: MessageFlags.Ephemeral
  });
});

test('lists pois when present', async () => {
  HuntPoi.findAll.mockResolvedValue([
    { name: 'A', points: 5, hint: 'h1', status: 'active' },
    { name: 'B', points: 10, hint: 'h2', status: 'active' }
  ]);
  const interaction = makeInteraction();

  await command.execute(interaction);

  const reply = interaction.reply.mock.calls[0][0];
  expect(reply.embeds[0].data.title).toContain('Points of Interest');
  expect(reply.embeds[0].data.footer.text).toContain('Page 1 of 1');
  expect(reply.flags).toBe(MessageFlags.Ephemeral);
});

test('handles fetch errors', async () => {
  const err = new Error('fail');
  HuntPoi.findAll.mockRejectedValue(err);
  const interaction = makeInteraction();
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

  await command.execute(interaction);

  expect(spy).toHaveBeenCalled();
  expect(interaction.reply).toHaveBeenCalledWith({
    content: '❌ Error fetching POIs.',
    flags: MessageFlags.Ephemeral
  });
  spy.mockRestore();
});

test('button paginates results', async () => {
  const pois = Array.from({ length: 11 }, (_, i) => ({ name: `P${i}`, points: i, hint: 'h', status: 'active' }));
  HuntPoi.findAll.mockResolvedValue(pois);
  const interaction = {
    customId: 'hunt_poi_page::1',
    deferUpdate: jest.fn().mockImplementation(function () { this.deferred = true; return Promise.resolve(); }),
    editReply: jest.fn(),
    reply: jest.fn(),
    deferred: false,
    replied: false
  };

  await command.button(interaction);

  expect(interaction.deferUpdate).toHaveBeenCalled();
  const embed = interaction.editReply.mock.calls[0][0].embeds[0];
  expect(embed.data.footer.text).toContain('Page 2 of');
});

test('admin sees select menu', async () => {
  HuntPoi.findAll.mockResolvedValue([
    { id: '1', name: 'Alpha', points: 5, hint: 'h1', status: 'active' }
  ]);
  const interaction = makeInteraction(['Admiral']);

  await command.execute(interaction);

  const reply = interaction.reply.mock.calls[0][0];
  expect(reply.components.length).toBeGreaterThan(0);
});

test('select menu highlights poi', async () => {
  HuntPoi.findAll.mockResolvedValue([
    { id: '1', name: 'Alpha', points: 5, hint: 'h1', status: 'active' }
  ]);
  const interaction = {
    customId: 'hunt_poi_select::0',
    values: ['1'],
    deferUpdate: jest.fn().mockImplementation(function () { this.deferred = true; return Promise.resolve(); }),
    editReply: jest.fn(),
    member: { roles: { cache: { map: fn => ['Admiral'].map(r => fn({ name: r })) } } },
    reply: jest.fn(),
    deferred: false,
    replied: false
  };

  await command.option(interaction);

  expect(interaction.deferUpdate).toHaveBeenCalled();
  const embed = interaction.editReply.mock.calls[0][0].embeds[0];
  expect(embed.data.fields[0].name).toContain('Alpha');
  expect(interaction.editReply.mock.calls[0][0].components.length).toBeGreaterThan(1);
});

test('archive button marks poi archived', async () => {
  const update = jest.fn();
  HuntPoi.findByPk.mockResolvedValue({ update });
  HuntPoi.findAll.mockResolvedValue([
    { id: '1', name: 'Alpha', points: 5, hint: 'h1', status: 'archived' }
  ]);

  const interaction = {
    customId: 'hunt_poi_archive::1::0',
    deferUpdate: jest.fn().mockImplementation(function () { this.deferred = true; return Promise.resolve(); }),
    editReply: jest.fn(),
    followUp: jest.fn(),
    member: { roles: { cache: { map: fn => ['Admiral'].map(r => fn({ name: r })) } } },
    user: { id: 'u1' },
    deferred: false,
    replied: false
  };

  await command.button(interaction);

  expect(update).toHaveBeenCalledWith({ status: 'archived', updated_by: 'u1' });
  const embed = interaction.editReply.mock.calls[0][0].embeds[0];
  expect(embed.data.fields[0].name).toContain('~~');
});

