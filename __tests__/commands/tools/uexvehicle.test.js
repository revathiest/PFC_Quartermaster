const { MockInteraction, MessageFlags, StringSelectMenuBuilder } = require('../../../__mocks__/discord.js');

jest.mock('../../../utils/verifyGuard', () => ({ isUserVerified: jest.fn() }));
jest.mock('../../../config/database', () => ({
  UexVehicle: { findAll: jest.fn(), findByPk: jest.fn() },
  UexVehiclePurchasePrice: { findAll: jest.fn() },
  UexTerminal: {}
}));

const { isUserVerified } = require('../../../utils/verifyGuard');
const db = require('../../../config/database');
const command = require('../../../commands/tools/uexvehicle');

describe('/uexvehicle command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects unverified users', async () => {
    isUserVerified.mockResolvedValue(false);
    const interaction = new MockInteraction({ options: { name: 'Aurora' } });

    await command.execute(interaction);

    expect(interaction.replyContent).toMatch('verify');
    expect(interaction.replyFlags).toBe(MessageFlags.Ephemeral);
  });

  test('replies when no vehicles found', async () => {
    isUserVerified.mockResolvedValue(true);
    db.UexVehicle.findAll.mockResolvedValue([]);
    const interaction = new MockInteraction({ options: { name: 'Unknown' } });

    await command.execute(interaction);

    expect(interaction.replyContent).toMatch('No vehicles found');
    expect(interaction.replyFlags).toBe(MessageFlags.Ephemeral);
  });

  test('returns embed when single match found', async () => {
    isUserVerified.mockResolvedValue(true);
    const vehicle = { id: 1, name: 'Aurora', length: 1, width: 1, height: 1 };
    db.UexVehicle.findAll.mockResolvedValue([vehicle]);
    const interaction = new MockInteraction({ options: { name: 'Aurora' } });
    interaction.reply = jest.fn();

    await command.execute(interaction);

    const embed = interaction.reply.mock.calls[0][0].embeds[0];
    expect(embed.data.title).toContain('Aurora');
  });

  test('shows select menu when multiple matches', async () => {
    isUserVerified.mockResolvedValue(true);
    db.UexVehicle.findAll.mockResolvedValue([{ id:1, name:'A' }, { id:2, name:'B' }]);
    const interaction = new MockInteraction({ options: { name: 'A' } });
    interaction.reply = jest.fn();

    await command.execute(interaction);

    const reply = interaction.reply.mock.calls[0][0];
    expect(reply.components).toBeDefined();
    expect(db.UexVehicle.findAll).toHaveBeenCalled();
  });

  test('option adds purchase locations or fallback', async () => {
    const update = jest.fn();
    db.UexVehicle.findByPk.mockResolvedValue({ id:5, name:'Ship', length:1,width:1,height:1 });
    db.UexVehiclePurchasePrice.findAll.mockResolvedValue([{ price_buy: 100, terminal:{name:'Term'} }]);

    await command.option({ values:['5'], update });

    const embed = update.mock.calls[0][0].embeds[0];
    expect(embed.data.fields).toEqual(
      expect.arrayContaining([
        { name:'Purchase Locations', value:'• Term — 100 aUEC' }
      ])
    );
  });
});
