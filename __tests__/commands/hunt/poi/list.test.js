jest.mock('../../../../config/database', () => ({
  HuntPoi: { findAll: jest.fn() }
}));

const { HuntPoi } = require('../../../../config/database');
const command = require('../../../../commands/hunt/poi/list');
const { MessageFlags } = require('../../../../__mocks__/discord.js');

const makeInteraction = () => ({ reply: jest.fn(), editReply: jest.fn() });

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
    { name: 'A', points: 5, hint: 'h1' },
    { name: 'B', points: 10, hint: 'h2' }
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
  const pois = Array.from({ length: 11 }, (_, i) => ({ name: `P${i}`, points: i, hint: 'h' }));
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

