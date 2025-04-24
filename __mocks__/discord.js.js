// __mocks__/discord.js.js

class MockInteraction {
  constructor({ options = {}, user = {}, member = {}, guild = {} }) {
    this.options = {
      getString: jest.fn().mockImplementation(key => options[key]),
    };
    this.user = user;
    this.member = member;
    this.guild = guild;
    this.deferred = false;
    this.replied = false;
  }

  async deferReply({ flags }) {
    this.deferred = true;
    this.deferFlags = flags;
  }

  async editReply({ content, components }) {
    this.replied = true;
    this.replyContent = content;
    this.replyComponents = components;
  }

  async reply({ content, flags }) {
    this.replied = true;
    this.replyContent = content;
    this.replyFlags = flags;
  }
}

const MessageFlags = {
  Ephemeral: 1 << 6
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

module.exports = {
  MockInteraction,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder: jest.fn(() => ({
    setName: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    addStringOption: jest.fn().mockReturnThis(),
    setDefaultMemberPermissions: jest.fn().mockReturnThis()
  })),
};
