jest.mock('../../../botactions/eventHandling/messageEvents/messageEvents/openaiHandler', () => jest.fn(), { virtual: true });
jest.mock('../../../botactions/eventHandling/messageEvents/messageEvents/filterHandler', () => jest.fn(), { virtual: true });
jest.mock('../../../botactions/eventHandling/messageEvents/messageEvents/logHandler', () => jest.fn(), { virtual: true });

const handleOpenAI = require('../../../botactions/eventHandling/messageEvents/messageEvents/openaiHandler');
const handleFiltering = require('../../../botactions/eventHandling/messageEvents/messageEvents/filterHandler');
const logMessage = require('../../../botactions/eventHandling/messageEvents/messageEvents/logHandler');

const { handleMessageCreate } = require('../../../botactions/eventHandling/messageEvents/openaiHandler');

describe('openaiHandler handleMessageCreate', () => {
  beforeEach(() => jest.clearAllMocks());

  test('ignores bots and messages outside guild', async () => {
    const message = { guild: null, author: { bot: false }, mentions: { has: jest.fn() } };
    await handleMessageCreate(message, {});
    expect(handleOpenAI).not.toHaveBeenCalled();
    expect(logMessage).not.toHaveBeenCalled();
  });

  test('invokes handleOpenAI when bot mentioned', async () => {
    const client = { user: {} };
    const message = { guild: { id: '1' }, author: { bot: false }, mentions: { has: jest.fn(() => true) } };
    await handleMessageCreate(message, client);
    expect(handleOpenAI).toHaveBeenCalledWith(message, client);
  });

  test('logs and filters when not mentioned', async () => {
    const client = { user: {} };
    const message = { guild: { id: '1' }, author: { bot: false }, mentions: { has: jest.fn(() => false) } };
    await handleMessageCreate(message, client);
    expect(logMessage).toHaveBeenCalledWith(message, '1');
    expect(handleFiltering).toHaveBeenCalledWith(message, client);
  });
});
