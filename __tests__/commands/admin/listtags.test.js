jest.mock('../../../config/database', () => require('../../../__mocks__/config/database'));
const { execute } = require('../../../commands/admin/listtags');
const { OrgTag } = require('../../../config/database');
const { MessageFlags } = require('discord.js');

const makeInteraction = () => ({
  deferReply: jest.fn(),
  editReply: jest.fn()
});

beforeEach(() => jest.clearAllMocks());

describe('/listtags command', () => {
  test('replies when no tags defined', async () => {
    const interaction = makeInteraction();
    OrgTag.findAll.mockResolvedValue([]);

    await execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalledWith({ flags: MessageFlags.Ephemeral });
    expect(interaction.editReply).toHaveBeenCalledWith('❌ No organization tags are currently defined.');
  });

  test('lists tags when present', async () => {
    const interaction = makeInteraction();
    OrgTag.findAll.mockResolvedValue([{ tag: 'PFC', rsiOrgId: 'PFCS' }]);

    await execute(interaction);

    expect(interaction.editReply).toHaveBeenCalledWith({
      content: expect.stringContaining('PFCS')
    });
  });

  test('handles fetch errors', async () => {
    const interaction = makeInteraction();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    OrgTag.findAll.mockRejectedValue(new Error('fail'));

    await execute(interaction);

    expect(errorSpy).toHaveBeenCalled();
    expect(interaction.editReply).toHaveBeenCalledWith('❌ Something went wrong while fetching org tags.');
    errorSpy.mockRestore();
  });
});
