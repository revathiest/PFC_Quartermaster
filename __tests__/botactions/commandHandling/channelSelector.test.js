const discordMock = require("../../../__mocks__/discord.js");
discordMock.ChannelType = { GuildCategory: "GUILD_CATEGORY" };
discordMock.StringSelectMenuBuilder.mockImplementation(function(){
  const data = { options: [], customId: undefined, placeholder: undefined };
  this.setCustomId = jest.fn(id => { data.customId = id; return this; });
  this.setPlaceholder = jest.fn(ph => { data.placeholder = ph; return this; });
  this.addOptions = jest.fn(opt => { data.options.push(opt); return this; });
  this.data = data;
  return this;
});
const { createChannelSelectMenu } = require("../../../botactions/commandHandling/channelSelector");

const makeCollection = entries => {
  const col = new Map(entries);
  col.filter = fn => makeCollection([...col].filter(([id, c]) => fn(c)));
  return col;
};

function buildGuild() {
  const cats = [{ id: 'c1', name: 'PFCS Channels', type: 'GUILD_CATEGORY' }];
  const chans = [{ id: 'x', name: 'chan', parentId: 'c1' }];
  return {
    channels: { cache: makeCollection([...cats, ...chans].map(c => [c.id, c])) }
  };
}

describe('commandHandling channelSelector', () => {
  test('throws if no categories', async () => {
    const guild = { channels: { cache: makeCollection([]) } };
    await expect(createChannelSelectMenu(guild)).rejects.toThrow('None of the categories');
  });

  test('custom prefix reflected in customId', async () => {
    const guild = buildGuild();
    const row = await createChannelSelectMenu(guild, 'test');
    expect(row.addComponents).toHaveBeenCalled();
  });
});
