jest.mock('../../../../config/database', () => ({
  Hunt: { findOne: jest.fn() },
  HuntSubmission: { create: jest.fn() },
  Config: { findOne: jest.fn() }
}));

const { Hunt, HuntSubmission, Config } = require('../../../../config/database');
jest.mock('../../../../utils/googleDrive', () => ({
  createDriveClient: jest.fn(() => ({ files: { create: jest.fn() } })),
  uploadScreenshot: jest.fn(() => ({ id: 'f', webViewLink: 'link' }))
}));
const { uploadScreenshot } = require('../../../../utils/googleDrive');
jest.mock('node-fetch');
const fetch = require('node-fetch');
const command = require('../../../../commands/hunt/poi/upload');
const { MessageFlags } = require('../../../../__mocks__/discord.js');

beforeEach(() => jest.clearAllMocks());

test('creates submission with attachment', async () => {
  Hunt.findOne.mockResolvedValue({ id: 'h1' });
  Config.findOne.mockResolvedValueOnce({ value: 'a' }).mockResolvedValueOnce({ value: 'r' });
  const activityCh = { send: jest.fn() };
  const reviewCh = { send: jest.fn().mockResolvedValue({ id: 'm' }) };
  const client = { channels: { fetch: jest.fn(id => (id === 'a' ? activityCh : reviewCh)) } };
  fetch.mockResolvedValue({ ok: true, buffer: async () => Buffer.from('img'), headers: { get: () => 'image/png' } });
  const interaction = {
    options: {
      getString: jest.fn(() => '1'),
      getAttachment: jest.fn(() => ({ url: 'http://img', contentType: 'image/png' }))
    },
    user: { id: 'u' },
    client,
    reply: jest.fn()
  };
  process.env.GOOGLE_DRIVE_HUNT_FOLDER = 'root';
  await command.execute(interaction);
  expect(HuntSubmission.create).toHaveBeenCalled();
  expect(uploadScreenshot).toHaveBeenCalled();
  expect(activityCh.send).toHaveBeenCalled();
  expect(reviewCh.send).toHaveBeenCalled();
  expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ flags: MessageFlags.Ephemeral }));
  delete process.env.GOOGLE_DRIVE_HUNT_FOLDER;
});

test('handles fetch failure', async () => {
  Hunt.findOne.mockResolvedValue({ id: 'h1' });
  fetch.mockResolvedValue({ ok: false });
  const interaction = {
    options: {
      getString: jest.fn(() => '1'),
      getAttachment: jest.fn(() => ({ url: 'http://img', contentType: 'image/png' }))
    },
    user: { id: 'u' },
    client: {},
    reply: jest.fn()
  };
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  await command.execute(interaction);
  expect(spy).toHaveBeenCalled();
  expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: '❌ Failed to submit proof.' }));
  spy.mockRestore();
});

test('no active hunt', async () => {
  Hunt.findOne.mockResolvedValue(null);
  const interaction = {
    options: {
      getString: jest.fn(() => '1'),
      getAttachment: jest.fn(() => ({ url: 'http://img', contentType: 'image/png' }))
    },
    reply: jest.fn()
  };
  await command.execute(interaction);
  expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ No active hunt.', flags: MessageFlags.Ephemeral });
});
