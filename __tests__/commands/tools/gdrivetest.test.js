const command = require('../../../commands/tools/gdrivetest');
const { MessageFlags, PermissionFlagsBits } = require('../../../__mocks__/discord.js');

jest.mock('../../../utils/googleDrive', () => ({
  createDriveClient: jest.fn()
}));

const { createDriveClient } = require('../../../utils/googleDrive');

const makeInteraction = (isAdmin = true) => ({
  member: { permissions: { has: jest.fn(() => isAdmin) } },
  deferReply: jest.fn(),
  editReply: jest.fn(),
  reply: jest.fn()
});

describe('/gdrivetest command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_DRIVE_TEST_FOLDER = 'root';
  });

  afterEach(() => {
    delete process.env.GOOGLE_DRIVE_TEST_FOLDER;
  });

  test('rejects non-admin users', async () => {
    const interaction = makeInteraction(false);

    await command.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
      flags: MessageFlags.Ephemeral
    }));
    expect(createDriveClient).not.toHaveBeenCalled();
  });

  test('rejects when env var missing', async () => {
    const interaction = makeInteraction();
    delete process.env.GOOGLE_DRIVE_TEST_FOLDER;

    await command.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({
      flags: MessageFlags.Ephemeral
    }));
    expect(createDriveClient).not.toHaveBeenCalled();
  });

  test('performs drive operations', async () => {
    const interaction = makeInteraction();
    const list = jest.fn().mockResolvedValue({ data: { files: [] } });
    const create = jest.fn()
      .mockResolvedValueOnce({ data: { id: 'folder' } })
      .mockResolvedValueOnce({ data: { id: 'file', webViewLink: 'link' } });
    createDriveClient.mockResolvedValue({ files: { list, create } });

    await command.execute(interaction);

    expect(createDriveClient).toHaveBeenCalled();
    expect(list).toHaveBeenCalled();
    expect(create).toHaveBeenCalledTimes(2);
    expect(interaction.editReply).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('link'),
      flags: MessageFlags.Ephemeral
    }));
  });

  test('handles errors gracefully', async () => {
    const interaction = makeInteraction();
    createDriveClient.mockRejectedValue(new Error('fail'));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await command.execute(interaction);

    expect(errSpy).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: '❌ Drive test failed.',
      flags: MessageFlags.Ephemeral
    });
    errSpy.mockRestore();
  });
});
