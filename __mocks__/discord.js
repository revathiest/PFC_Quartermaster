// __mocks__/discord.js.js

class MockInteraction {
  constructor({
    options = {},
    user = { id: 'mock-user-id', username: 'TestUser', bot: false },
    member = {},
    guild = {},
    channel = null
  }) {
    this.options = {
      getString: jest.fn().mockImplementation(key => options[key]),
      getSubcommand: jest.fn(() => options.subcommand || null),
    };
    this.user = user;
    this.member = member;
    this.guild = guild;
    this.channel = channel;
    this.deferred = false;
    this.replied = false;
  }

  async deferReply({ flags }) {
    this.deferred = true;
    this.deferFlags = flags;
  }

  async editReply({ content, components, embeds }) {
    this.replied = true;
    this.replyContent = content;
    this.replyComponents = components;
    this.replyEmbeds = embeds;
  }

  async reply({ content, flags }) {
    this.replied = true;
    this.replyContent = content;
    this.replyFlags = flags;
  }
}

const EmbedBuilder = jest.fn().mockImplementation(() => {
  const data = {
    title: '',
    description: '',
    color: null,
    fields: [],
    footer: {},
    timestamp: null
  };

  const embed = {
    setTitle: jest.fn().mockImplementation(title => { data.title = title; return embed; }),
    setDescription: jest.fn().mockImplementation(desc => { data.description = desc; return embed; }),
    setColor: jest.fn().mockImplementation(color => { data.color = color; return embed; }),
    addFields: jest.fn().mockImplementation((...args) => {
      const flatFields = args.flat();
      data.fields.push(...flatFields);
      return embed;
    }),
    setFooter: jest.fn().mockImplementation(footer => { data.footer = footer; return embed; }),
    setTimestamp: jest.fn().mockImplementation(() => { data.timestamp = Date.now(); return embed; }),
    toJSON: jest.fn(() => data),
    data
  };

  return embed;
});

const PermissionFlagsBits = {
  Administrator: 0x00000008
};

const MessageFlags = {
  Ephemeral: 1 << 6,
};

const ActionRowBuilder = jest.fn().mockImplementation(() => ({
  addComponents: jest.fn().mockReturnThis(),
}));

const ButtonBuilder = jest.fn().mockImplementation(() => ({
  setCustomId: jest.fn().mockReturnThis(),
  setLabel: jest.fn().mockReturnThis(),
  setStyle: jest.fn().mockReturnThis(),
}));

const ButtonStyle = {
  Primary: 1,
};

const SlashCommandBuilder = jest.fn(() => {
  const builder = {
    name: undefined,
    description: undefined,
    options: [],
    setName(name) {
      this.name = name;
      return this;
    },
    setDescription(description) {
      this.description = description;
      return this;
    },
    addStringOption(fn) {
      const option = { type: 'string', name: undefined, description: undefined, required: false };
      fn({
        setName(name) { option.name = name; return this; },
        setDescription(desc) { option.description = desc; return this; },
        setRequired(req) { option.required = req; return this; },
      });
      this.options.push(option);
      return this;
    },
    addUserOption(fn) {
      const option = { type: 'user', name: undefined, description: undefined, required: false };
      fn({
        setName(name) { option.name = name; return this; },
        setDescription(desc) { option.description = desc; return this; },
        setRequired(req) { option.required = req; return this; },
      });
      this.options.push(option);
      return this;
    },
    setDefaultMemberPermissions() {
      return this;
    },
  };
  return builder;
});

module.exports = {
  MockInteraction,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
};
