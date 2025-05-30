const discordMock = require("../../__mocks__/discord.js");
discordMock.ChannelType = { GuildCategory: "GUILD_CATEGORY" };
discordMock.StringSelectMenuBuilder.mockImplementation(function(){
  const data = { options: [], customId: undefined, placeholder: undefined };
  this.setCustomId = jest.fn(id => { data.customId = id; return this; });
  this.setPlaceholder = jest.fn(ph => { data.placeholder = ph; return this; });
  this.addOptions = jest.fn(opt => { data.options.push(opt); return this; });
  this.data = data;
  return this;
});
const { createChannelSelectMenu } = require('../../botactions/channelSelector');

const makeCollection = entries => {
  const col = new Map(entries);
  col.filter = fn => makeCollection([...col].filter(([id, c]) => fn(c)));
  col.forEach = callback => { for (const val of col.values()) callback(val); };
  return col;
};

function buildGuild() {
  const categories = [
    { id: 'cat', name: 'PFCS Channels', type: 'GUILD_CATEGORY' },
  ];
  const text = [
    { id: 't1', name: 'chat1', parentId: 'cat' },
    { id: 't2', name: 'chat2', parentId: 'cat' }
  ];
  const all = [...categories, ...text];
  return {
    channels: { cache: makeCollection(all.map(c => [c.id, c])) }
  };
}

describe('createChannelSelectMenu', () => {
  test('throws when categories not present', async () => {
    const guild = { channels: { cache: makeCollection([]) } };
    await expect(createChannelSelectMenu(guild)).rejects.toThrow('None of the categories');
  });

  test('builds menu with options', async () => {
    const guild = buildGuild();
    const row = await createChannelSelectMenu(guild);
    expect(row.addComponents).toHaveBeenCalled();
  });
});
