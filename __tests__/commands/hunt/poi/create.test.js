jest.mock('../../../../config/database', () => ({
  HuntPoi: { create: jest.fn() }
}));

jest.mock('../../../../utils/googleDrive', () => ({
  createDriveClient: jest.fn(() => ({ files: { create: jest.fn() } })),
  uploadScreenshot: jest.fn(() => ({ webViewLink: 'refLink' }))
}));
jest.mock('node-fetch');

const { HuntPoi } = require('../../../../config/database');
const command = require('../../../../commands/hunt/poi/create');
const { MessageFlags } = require('../../../../__mocks__/discord.js');
const { uploadScreenshot } = require('../../../../utils/googleDrive');
const fetch = require('node-fetch');

const makeInteraction = () => ({
  options: {
    getString: jest.fn(key => ({
      name: 'Alpha',
      hint: 'Find me',
      location: 'Area18'
    }[key])),
    getAttachment: jest.fn(() => ({ url: 'img' })),
    getInteger: jest.fn(() => 10)
  },
  member: { roles: { cache: { map: fn => [] } } },
  user: { id: 'u1' },
  reply: jest.fn()
});

beforeEach(() => {
  jest.clearAllMocks();
  fetch.mockResolvedValue({
    ok: true,
    buffer: async () => Buffer.from('img'),
    headers: { get: () => 'image/png' }
  });
  process.env.GOOGLE_DRIVE_HUNT_FOLDER = 'root';
});

afterEach(() => {
  delete process.env.GOOGLE_DRIVE_HUNT_FOLDER;
});

test('creates poi and replies', async () => {
  const interaction = makeInteraction();

  await command.execute(interaction);

  expect(uploadScreenshot).toHaveBeenCalled();
  const fileName = uploadScreenshot.mock.calls[0][3];
  expect(fileName).toMatch(/^Alpha_\d{4}-\d{2}-\d{2}_\d{4}\.jpg$/);
  expect(HuntPoi.create).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Alpha',
    hint: 'Find me',
    location: 'Area18',
    image_url: 'refLink',
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
    location: 'loc'
  }[key]));
  interaction.options.getAttachment = jest.fn(() => null);

  await command.execute(interaction);

  expect(uploadScreenshot).not.toHaveBeenCalled();
  expect(HuntPoi.create).toHaveBeenCalledWith(expect.objectContaining({ image_url: null }));
});

test('handles db error', async () => {
  const interaction = makeInteraction();
  const err = new Error('fail');
  HuntPoi.create.mockRejectedValue(err);
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

  await command.execute(interaction);

  expect(uploadScreenshot).toHaveBeenCalled();
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
