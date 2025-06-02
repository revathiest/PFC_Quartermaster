const { MockInteraction, MessageFlags } = require('../../../__mocks__/discord.js');

jest.mock('../../../utils/verifyGuard', () => ({ isUserVerified: jest.fn() }));
jest.mock('../../../config/database', () => ({
  UexTerminal: { findAll: jest.fn() }
}));

const { isUserVerified } = require('../../../utils/verifyGuard');
const db = require('../../../config/database');
const command = require('../../../commands/tools/uexterminals');

describe('/uexterminals command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects when user not verified', async () => {
    isUserVerified.mockResolvedValue(false);
    const interaction = new MockInteraction({ options: { location: 'Area18' } });

    await command.execute(interaction);

    expect(interaction.replyContent).toMatch('verify');
    expect(interaction.replyFlags).toBe(MessageFlags.Ephemeral);
  });

  test('replies when no terminals found', async () => {
    isUserVerified.mockResolvedValue(true);
    db.UexTerminal.findAll.mockResolvedValue([]);
    const interaction = new MockInteraction({ options: { location: 'Nowhere' } });

    await command.execute(interaction);

    expect(interaction.replyContent).toMatch('No terminals');
    expect(interaction.replyFlags).toBe(MessageFlags.Ephemeral);
  });

  test('returns embed table when results found', async () => {
    isUserVerified.mockResolvedValue(true);
    db.UexTerminal.findAll.mockResolvedValue([
      { code:'A1', name:'Term1', space_station_name:'Port' }
    ]);
    const interaction = new MockInteraction({ options: { location: 'Port' } });
    interaction.reply = jest.fn();

    await command.execute(interaction);

    const reply = interaction.reply.mock.calls[0][0];
    expect(reply.embeds[0].data.title).toContain('Terminals in');
    expect(reply.components).toHaveLength(2);
  });

  test('button updates page with ephemeral embed', async () => {
    db.UexTerminal.findAll.mockResolvedValue([
      { code:'A1', name:'T1', space_station_name:'Port' }
    ]);
    const update = jest.fn();
    const btn = {
      customId: 'uexterminals_page::Port::0::false',
      update,
      message: {},
    };
    await command.button(btn);
    const embed = update.mock.calls[0][0].embeds[0];
    expect(embed.data.title).toContain('Terminals in');
    expect(update).toHaveBeenCalled();
  });

  test('button public updates or sends to channel', async () => {
    db.UexTerminal.findAll.mockResolvedValue([{ code:'A1', name:'T1', space_station_name:'Port' }]);
    const update = jest.fn();
    const send = jest.fn();
    const btn = {
      customId: 'uexterminals_page::Port::0::true',
      update,
      channel: { send },
      message: { interaction: true },
      deferUpdate: jest.fn()
    };
    await command.button(btn);
    expect(send).toHaveBeenCalled();
    expect(btn.deferUpdate).toHaveBeenCalled();
  });
});
