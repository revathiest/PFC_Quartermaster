const fs = require('fs');
const { SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, MockInteraction } = require('discord.js');

jest.mock('fs');

jest.mock('../../../commands/hunt/help.js', () => {
  const { SlashCommandSubcommandBuilder } = require('discord.js');
  const builder = new SlashCommandSubcommandBuilder().setName('help').setDescription('help');
  return {
    data: () => builder,
    execute: jest.fn()
  };
}, { virtual: true });

jest.mock('../../../commands/hunt/poi.js', () => {
  const { SlashCommandSubcommandGroupBuilder } = require('discord.js');
  const builder = new SlashCommandSubcommandGroupBuilder().setName('poi').setDescription('POI');
  builder.addSubcommand(sub => sub.setName('create').setDescription('c'));
  return {
    data: () => builder,
    group: true,
    execute: jest.fn()
  };
}, { virtual: true });

fs.readdirSync.mockReturnValue(['help.js', 'poi.js']);

const command = require('../../../commands/hunt');

test('registers subcommand group', () => {
  const types = command.data.options.map(o => o.type);
  expect(types).toContain('subcommandgroup');
});

test('routes to group execute', async () => {
  const interaction = new MockInteraction({ options: { subcommandGroup: 'poi', subcommand: 'create' } });
  await command.execute(interaction, {});
  const poiModule = require('../../../commands/hunt/poi.js');
  expect(poiModule.execute).toHaveBeenCalled();
});
