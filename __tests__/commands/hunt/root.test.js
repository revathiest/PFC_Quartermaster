const fs = require('fs');
const { SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, MockInteraction, MessageFlags } = require('discord.js');

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

jest.mock('../../../commands/hunt/poi/list.js', () => ({ button: jest.fn(), option: jest.fn(), modal: jest.fn() }), { virtual: true });
jest.mock('../../../commands/hunt/nofunc', () => ({}), { virtual: true });
jest.mock('../../../commands/hunt/fail', () => ({ execute: jest.fn(() => { throw new Error('boom'); }) }), { virtual: true });
jest.mock('../../../commands/hunt/badgroup', () => ({ group: true }), { virtual: true });

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

test('option routes to poi list handler', async () => {
  const interaction = { customId: 'hunt_poi_select::0', replied: false, deferred: false };
  const list = require('../../../commands/hunt/poi/list.js');
  await command.option(interaction, {});
  expect(list.option).toHaveBeenCalledWith(interaction, {});
});

test('modal routes to poi list handler', async () => {
  const interaction = { customId: 'hunt_poi_edit_step1::1', replied: false, deferred: false };
  const list = require('../../../commands/hunt/poi/list.js');
  await command.modal(interaction, {});
  expect(list.modal).toHaveBeenCalledWith(interaction, {});
});

test('option ignores unrelated ids', async () => {
  const interaction = { customId: 'other', replied: false, deferred: false };
  const list = require('../../../commands/hunt/poi/list.js');
  await command.option(interaction, {});
  expect(list.option).not.toHaveBeenCalled();
});

test('button ignores unrelated ids', async () => {
  const interaction = { customId: 'other', replied: false, deferred: false };
  const list = require('../../../commands/hunt/poi/list.js');
  await command.button(interaction, {});
  expect(list.button).not.toHaveBeenCalled();
});

test('replies when subcommand not implemented', async () => {
  const interaction = new MockInteraction({ options: { subcommand: 'nofunc' } });
  const replySpy = jest.spyOn(interaction, 'reply');
  await command.execute(interaction, {});
  expect(replySpy).toHaveBeenCalledWith({
    content: '❌ Subcommand "nofunc" not implemented.',
    flags: MessageFlags.Ephemeral
  });
});

test('handles subcommand error', async () => {
  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const interaction = new MockInteraction({ options: { subcommand: 'fail' } });
  const replySpy = jest.spyOn(interaction, 'reply');
  await command.execute(interaction, {});
  expect(errSpy).toHaveBeenCalled();
  expect(replySpy).toHaveBeenCalledWith({
    content: '❌ Failed to run subcommand.',
    flags: MessageFlags.Ephemeral
  });
  errSpy.mockRestore();
});

test('logs error when subcommand fails to load', () => {
  fs.readdirSync.mockReturnValue(['bad.js']);
  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.isolateModules(() => {
    jest.doMock('../../../commands/hunt/bad.js', () => { throw new Error('nope'); }, { virtual: true });
    require('../../../commands/hunt');
  });
  expect(errSpy).toHaveBeenCalled();
  errSpy.mockRestore();
  fs.readdirSync.mockReturnValue(['help.js', 'poi.js']);
});

test('button handles list load error', async () => {
  jest.resetModules();
  const fsMock = require('fs');
  fsMock.readdirSync.mockReturnValue(['help.js', 'poi.js']);
  jest.doMock('../../../commands/hunt/poi/list.js', () => { throw new Error('fail'); }, { virtual: true });
  const commandErr = require('../../../commands/hunt');
  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const interaction = { customId: 'hunt_poi_page::1', replied: false, deferred: false, reply: jest.fn() };
  await commandErr.button(interaction, {});
  expect(errSpy).toHaveBeenCalled();
  expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ Something went wrong.', flags: MessageFlags.Ephemeral });
  errSpy.mockRestore();
  jest.dontMock('../../../commands/hunt/poi/list.js');
});

test('button warns on unknown prefix', async () => {
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const interaction = { customId: 'hunt_unknown::1', replied: false, deferred: false, reply: jest.fn() };
  await command.button(interaction, {});
  expect(warnSpy).toHaveBeenCalled();
  expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ Button handler not found.', flags: MessageFlags.Ephemeral });
  warnSpy.mockRestore();
});

test('option warns on unknown prefix', async () => {
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const interaction = { customId: 'hunt_unknown::1', replied: false, deferred: false, reply: jest.fn() };
  await command.option(interaction, {});
  expect(warnSpy).toHaveBeenCalled();
  expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ Select menu handler not found.', flags: MessageFlags.Ephemeral });
  warnSpy.mockRestore();
});

test('modal warns on unknown prefix', async () => {
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const interaction = { customId: 'hunt_unknown::1', replied: false, deferred: false, reply: jest.fn() };
  await command.modal(interaction, {});
  expect(warnSpy).toHaveBeenCalled();
  expect(interaction.reply).toHaveBeenCalledWith({ content: '❌ Modal handler not found.', flags: MessageFlags.Ephemeral });
  warnSpy.mockRestore();
});

test('falls back to subcommand when group execute missing', async () => {
  const interaction = new MockInteraction({ options: { subcommandGroup: 'badgroup', subcommand: 'help' } });
  const helpModule = require('../../../commands/hunt/help.js');
  const spy = helpModule.execute;
  await command.execute(interaction, {});
  expect(spy).toHaveBeenCalled();
});
