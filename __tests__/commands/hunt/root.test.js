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

jest.mock('../../../commands/hunt/poi/list.js', () => ({ button: jest.fn() }), { virtual: true });

fs.readdirSync.mockReturnValue(['help.js', 'poi.js']);

const command = require('../../../commands/hunt');

afterEach(() => jest.clearAllMocks());

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

test('button routes to poi list handler', async () => {
  const interaction = { customId: 'hunt_poi_page::1', replied: false, deferred: false };
  const list = require('../../../commands/hunt/poi/list.js');
  await command.button(interaction, {});
  expect(list.button).toHaveBeenCalledWith(interaction, {});
});

test('button ignores unrelated ids', async () => {
  const interaction = { customId: 'other', replied: false, deferred: false };
  const list = require('../../../commands/hunt/poi/list.js');
  await command.button(interaction, {});
  expect(list.button).not.toHaveBeenCalled();
});

test('execute replies when subcommand missing', async () => {
  const interaction = new MockInteraction({ options: { subcommand: 'missing' } });
  await command.execute(interaction, {});
  expect(interaction.replyContent).toMatch('Failed to run subcommand');
});

test('execute handles subcommand error', async () => {
  const help = require('../../../commands/hunt/help.js');
  help.execute.mockRejectedValue(new Error('fail'));
  const interaction = new MockInteraction({ options: { subcommand: 'help' } });
  await command.execute(interaction, {});
  expect(interaction.replyContent).toMatch('Failed to run');
});

test('button handles errors from poi list', async () => {
  const list = require('../../../commands/hunt/poi/list.js');
  list.button.mockRejectedValue(new Error('bad'));
  const interaction = { customId: 'hunt_poi_page::1', replied: false, deferred: false, reply: jest.fn() };
  await command.button(interaction, {});
  expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Something went wrong') }));
});
