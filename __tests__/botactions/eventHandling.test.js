jest.mock('../../botactions/eventHandling/interactionEvents', () => ({ handleInteraction: jest.fn() }));
jest.mock('../../botactions/eventHandling/messageEvents', () => ({
  handleMessageCreate: jest.fn(),
  handleMessageDelete: jest.fn(),
  handleMessageUpdate: jest.fn()
}));
jest.mock('../../botactions/eventHandling/reactionEvents', () => ({ handleReactionAdd: jest.fn(), handleReactionRemove: jest.fn() }));
jest.mock('../../botactions/eventHandling/voiceEvents', () => ({ handleVoiceStateUpdate: jest.fn() }));
jest.mock('../../botactions/eventHandling/moderationEvents', () => ({
  handleGuildMemberRemove: jest.fn(),
  handleGuildBanAdd: jest.fn(),
  handleGuildMemberUpdate: jest.fn(),
}));

const interactionModule = require('../../botactions/eventHandling/interactionEvents');
const messageEvents = require('../../botactions/eventHandling/messageEvents');
const reactionEvents = require('../../botactions/eventHandling/reactionEvents');
const voiceEvents = require('../../botactions/eventHandling/voiceEvents');
const moderationEvents = require('../../botactions/eventHandling/moderationEvents');
const events = require('../../botactions/eventHandling');

describe('eventHandling index', () => {
  test('exports functions from submodules', async () => {
    await events.interactionHandler.handleInteraction('i');
    await events.handleMessageCreate('m');
    await events.handleMessageDelete('d');
    await events.handleMessageUpdate('o', 'n');
    await events.handleReactionAdd('r');
    await events.handleReactionRemove('rr');
    await events.handleVoiceStateUpdate('v');
    await events.handleGuildMemberRemove('mr');
    await events.handleGuildBanAdd('ban');
    await events.handleGuildMemberUpdate('om', 'nm');

    expect(interactionModule.handleInteraction).toHaveBeenCalledWith('i');
    expect(messageEvents.handleMessageCreate).toHaveBeenCalledWith('m');
    expect(messageEvents.handleMessageDelete).toHaveBeenCalledWith('d');
    expect(messageEvents.handleMessageUpdate).toHaveBeenCalledWith('o', 'n');
    expect(reactionEvents.handleReactionAdd).toHaveBeenCalledWith('r');
    expect(reactionEvents.handleReactionRemove).toHaveBeenCalledWith('rr');
    expect(voiceEvents.handleVoiceStateUpdate).toHaveBeenCalledWith('v');
    expect(moderationEvents.handleGuildMemberRemove).toHaveBeenCalledWith('mr');
    expect(moderationEvents.handleGuildBanAdd).toHaveBeenCalledWith('ban');
    expect(moderationEvents.handleGuildMemberUpdate).toHaveBeenCalledWith('om', 'nm');
  });
});
