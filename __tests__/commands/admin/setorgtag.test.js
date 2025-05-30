jest.mock('../../../config/database', () => require('../../../__mocks__/config/database'));
const { OrgTag } = require('../../../config/database');
const { execute } = require('../../../commands/admin/setorgtag');
const { MessageFlags, PermissionFlagsBits } = require('discord.js');

const makeInteraction = (isAdmin = true) => ({
  member: { permissions: { has: jest.fn(() => isAdmin) } },
  options: {
    getString: jest.fn(name => (name === 'rsi_org_id' ? 'pfcs' : 'pfc'))
  },
  reply: jest.fn()
});

beforeEach(() => jest.clearAllMocks());
beforeAll(() => { OrgTag.upsert = jest.fn(); });

describe('/set-org-tag command', () => {
  test('blocks non-admin users', async () => {
    const interaction = makeInteraction(false);
    await execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith({ content: expect.any(String), flags: MessageFlags.Ephemeral });
    expect(OrgTag.upsert).not.toHaveBeenCalled();
  });

  test('saves org tag with uppercase values', async () => {
    const interaction = makeInteraction(true);
    await execute(interaction);
    expect(OrgTag.upsert).toHaveBeenCalledWith({ rsiOrgId: 'PFCS', tag: 'PFC' });
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('PFCS'), flags: MessageFlags.Ephemeral }));
  });

  test('handles errors gracefully', async () => {
    const interaction = makeInteraction(true);
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    OrgTag.upsert.mockRejectedValue(new Error('fail'));

    await execute(interaction);

    expect(spy).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Something went wrong'), flags: MessageFlags.Ephemeral }));
    spy.mockRestore();
  });
});
