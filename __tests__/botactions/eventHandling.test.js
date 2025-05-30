jest.mock('../../botactions/eventHandling/interactionEvents', () => ({ handleInteraction: jest.fn() }));
jest.mock('../../botactions/eventHandling/messageEvents', () => ({ handleMessageCreate: jest.fn() }));
jest.mock('../../botactions/eventHandling/reactionEvents', () => ({ handleReactionAdd: jest.fn(), handleReactionRemove: jest.fn() }));
jest.mock('../../botactions/eventHandling/voiceEvents', () => ({ handleVoiceStateUpdate: jest.fn() }));

const interactionModule = require('../../botactions/eventHandling/interactionEvents');
const messageEvents = require('../../botactions/eventHandling/messageEvents');
const reactionEvents = require('../../botactions/eventHandling/reactionEvents');
const voiceEvents = require('../../botactions/eventHandling/voiceEvents');
const events = require('../../botactions/eventHandling');

describe('eventHandling index', () => {
  test('exports functions from submodules', async () => {
    await events.interactionHandler.handleInteraction('i');
    await events.handleMessageCreate('m');
    await events.handleReactionAdd('r');
    await events.handleReactionRemove('rr');
    await events.handleVoiceStateUpdate('v');

    expect(interactionModule.handleInteraction).toHaveBeenCalledWith('i');
    expect(messageEvents.handleMessageCreate).toHaveBeenCalledWith('m');
    expect(reactionEvents.handleReactionAdd).toHaveBeenCalledWith('r');
    expect(reactionEvents.handleReactionRemove).toHaveBeenCalledWith('rr');
    expect(voiceEvents.handleVoiceStateUpdate).toHaveBeenCalledWith('v');
  });
});
