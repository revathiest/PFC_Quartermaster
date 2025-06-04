const fs = require('fs');
const { SlashCommandSubcommandBuilder, MockInteraction, MessageFlags, PermissionFlagsBits } = require('discord.js');

jest.mock('fs');

const mockExecute = jest.fn();

jest.mock('../../../../commands/hunt/poi/create.js', () => ({
  data: () => new (require('discord.js').SlashCommandSubcommandBuilder)().setName('create').setDescription('desc'),
  execute: mockExecute
}));

beforeEach(() => {
  jest.clearAllMocks();
  fs.readdirSync.mockReturnValue(['create.js']);
});

afterEach(() => jest.resetModules());

test('blocks create without permission', async () => {
  const command = require('../../../../commands/hunt/poi');
  const interaction = new MockInteraction({ options: { subcommand: 'create' }, member: { permissions: { has: jest.fn(() => false) } } });
  await command.execute(interaction, {});
  expect(interaction.replyContent).toBe('You do not have permission to use this subcommand.');
  expect(interaction.replyFlags).toBe(MessageFlags.Ephemeral);
  expect(mockExecute).not.toHaveBeenCalled();
});

test('executes create with permission', async () => {
  const command = require('../../../../commands/hunt/poi');
  const interaction = new MockInteraction({ options: { subcommand: 'create' }, member: { permissions: { has: jest.fn(bit => bit === PermissionFlagsBits.KickMembers) } } });
  await command.execute(interaction, {});
  expect(mockExecute).toHaveBeenCalled();
});
