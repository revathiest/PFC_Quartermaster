jest.mock('../../../utils/parseDice');

const parseDice = require('../../../utils/parseDice');
const roll = require('../../../commands/fun/roll');
const { MessageFlags } = require('../../../__mocks__/discord.js');

beforeEach(() => {
  jest.clearAllMocks();
});

test('sends embed with dice result', async () => {
  parseDice.mockReturnValue({ total: 7, rolls: ['3', '4'] });

  const interaction = {
    options: { getString: jest.fn(key => (key === 'formula' ? '2d4' : 'test')) },
    reply: jest.fn(),
  };
  await roll.execute(interaction);

  expect(parseDice).toHaveBeenCalledWith('2d4');
  expect(interaction.reply).toHaveBeenCalled();
  const embed = interaction.reply.mock.calls[0][0].embeds[0].toJSON();
  expect(embed.title).toContain('Dice Roll');
  expect(embed.fields[1].value).toBe('**7**');
});

test('handles invalid formula error', async () => {
  parseDice.mockImplementation(() => { throw new Error('bad'); });
  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const interaction = { options: { getString: jest.fn(() => 'bad') }, reply: jest.fn() };

  await roll.execute(interaction);

  expect(interaction.reply).toHaveBeenCalledWith({
    content: expect.stringContaining('Invalid dice formula'),
    flags: MessageFlags.Ephemeral,
  });
  errSpy.mockRestore();
});

