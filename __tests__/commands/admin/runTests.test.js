const fs = require('fs');
const { exec } = require('child_process');
const { AttachmentBuilder, MessageFlags } = require('discord.js');
const path = require('path');

jest.mock('child_process', () => ({ exec: jest.fn() }));
jest.mock('fs');

const { execute } = require('../../../commands/admin/runTests');

const makeInteraction = () => ({
  deferReply: jest.fn(),
  editReply: jest.fn()
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('/runtests command', () => {
  test('runs tests and uploads file', async () => {
    const interaction = makeInteraction();
    exec.mockImplementation((cmd, opts, cb) => cb(null, 'out', ''));
    fs.writeFileSync.mockReturnValue();
    fs.unlink.mockImplementation((p, cb) => cb(null));

    await execute(interaction);

    expect(exec).toHaveBeenCalledWith('npm run test', expect.any(Object), expect.any(Function));
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('Test run complete'),
      files: expect.any(Array),
      flags: MessageFlags.Ephemeral
    }));
  });

  test('handles file errors gracefully', async () => {
    const interaction = makeInteraction();
    exec.mockImplementation((cmd, opts, cb) => cb(null, 'out', ''));
    fs.writeFileSync.mockImplementation(() => { throw new Error('fail'); });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await execute(interaction);

    expect(spy).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith({ content: '❌ Test ran but failed to upload output.', flags: MessageFlags.Ephemeral });
    spy.mockRestore();
  });
});
