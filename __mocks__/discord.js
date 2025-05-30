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
    setThumbnail: jest.fn().mockImplementation(url => {
      data.thumbnail = { url };
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
  Administrator: 0x00000008,
  ManageGuild: 0x00000020,
  ManageRoles: 0x00010000
};

const PermissionsBitField = {
  Flags: { SendMessages: 0x00000000 },
  resolve: (bits) => bits
};

const ComponentType = { StringSelect: 'StringSelect' };

const MessageFlags = {
  Ephemeral: 1 << 6,
};

const ActionRowBuilder = jest.fn().mockImplementation(() => ({
  addComponents: jest.fn().mockReturnThis(),
}));

const StringSelectMenuBuilder = jest.fn().mockImplementation(function () {
  const data = { options: [], customId: undefined, placeholder: undefined };
  this.setCustomId = jest.fn(id => {
    data.customId = id;
    return this;
  });
  this.setPlaceholder = jest.fn(ph => {
    data.placeholder = ph;
    return this;
  });
  this.addOptions = jest.fn(opts => {
    data.options.push(...opts);
    return this;
  });
  this.data = data;
  return this;
});

const ButtonBuilder = jest.fn().mockImplementation(function () {
  const data = { customId: undefined, label: undefined, style: undefined, disabled: false };
  this.setCustomId = jest.fn(id => { data.customId = id; return this; });
  this.setLabel = jest.fn(label => { data.label = label; return this; });
  this.setStyle = jest.fn(style => { data.style = style; return this; });
  this.setDisabled = jest.fn(disabled => { data.disabled = disabled; return this; });
  this.data = data;
  return this;
});

const ButtonStyle = {
  Primary: 1,
  Secondary: 2,
};

const AttachmentBuilder = jest.fn(function(path) {
  this.path = path;
});

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
    addIntegerOption(fn) {
      const option = { type: 'integer', name: undefined, description: undefined, required: false };
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
    addSubcommand(fn) {
      const sub = { type: 'subcommand', name: undefined, description: undefined, options: [] };
      const subBuilder = {
        setName(name) { sub.name = name; return this; },
        setDescription(desc) { sub.description = desc; return this; },
        addUserOption(userFn) {
          const opt = { type: 'user', name: undefined, description: undefined, required: false };
          userFn({
            setName(n) { opt.name = n; return this; },
            setDescription(d) { opt.description = d; return this; },
            setRequired(r) { opt.required = r; return this; },
            addChoices: jest.fn()
          });
          sub.options.push(opt);
          return this;
        },
        addStringOption(strFn) {
          const opt = { type: 'string', name: undefined, description: undefined, required: false };
          strFn({
            setName(n) { opt.name = n; return this; },
            setDescription(d) { opt.description = d; return this; },
            setRequired(r) { opt.required = r; return this; },
            addChoices: jest.fn()
          });
          sub.options.push(opt);
          return this;
        }
      };
      fn(subBuilder);
      this.options.push(sub);
      return this;
    },
    addRoleOption(fn) {
      const option = { type: 'role', name: undefined, description: undefined, required: false };
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
    setDMPermission() {
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
  StringSelectMenuBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder: SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
  PermissionFlagsBits,
  PermissionsBitField,
  ComponentType
};
