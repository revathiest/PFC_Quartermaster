jest.mock('../../../../config/database', () => ({
  HuntPoi: { create: jest.fn() }
}));

const { HuntPoi } = require('../../../../config/database');
const command = require('../../../../commands/hunt/poi/create');
const { MessageFlags } = require('../../../../__mocks__/discord.js');

const makeInteraction = () => ({
  options: {
    getString: jest.fn(key => ({
      name: 'Alpha',
      hint: 'Find me',
      location: 'Area18',
      image: 'img'
    }[key])),
    getInteger: jest.fn(() => 10)
  },
  user: { id: 'u1' },
  reply: jest.fn()
});

beforeEach(() => jest.clearAllMocks());

test('creates poi and replies', async () => {
  const interaction = makeInteraction();

  await command.execute(interaction);

  expect(HuntPoi.create).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Alpha',
    hint: 'Find me',
    location: 'Area18',
    image_url: 'img',
    points: 10,
    status: 'active',
    created_by: 'u1'
  }));
  expect(interaction.reply).toHaveBeenCalledWith({
    content: expect.stringContaining('Alpha'),
    flags: MessageFlags.Ephemeral
  });
});

test('handles missing optional image', async () => {
  const interaction = makeInteraction();
  interaction.options.getString = jest.fn(key => ({
    name: 'Bravo',
    hint: 'hint',
    location: 'loc',
    image: null
  }[key]));

  await command.execute(interaction);

  expect(HuntPoi.create).toHaveBeenCalledWith(expect.objectContaining({ image_url: null }));
});

test('handles db error', async () => {
  const interaction = makeInteraction();
  const err = new Error('fail');
  HuntPoi.create.mockRejectedValue(err);
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

  await command.execute(interaction);

  expect(spy).toHaveBeenCalled();
  expect(interaction.reply).toHaveBeenCalledWith({
    content: '❌ Failed to create POI.',
    flags: MessageFlags.Ephemeral
  });
  spy.mockRestore();
});

test('defines command options', () => {
  const data = command.data();
  const optionSummary = data.options.map(o => ({ name: o.name, required: o.required }));
  expect(optionSummary).toEqual([
    { name: 'name', required: true },
    { name: 'hint', required: true },
    { name: 'location', required: true },
    { name: 'points', required: true },
    { name: 'image', required: false }
  ]);
});
