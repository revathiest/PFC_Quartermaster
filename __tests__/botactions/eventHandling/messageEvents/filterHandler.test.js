jest.mock('../../../../botactions/eventHandling/messageEvents/actionPerformer');
jest.mock('../../../../botactions/messages.json', () => ({
  words: {
    bad: { action: 'respond', response: 'no' },
    personal: { action: 'personal', userId: 'u1', response: 'hey' }
  },
  regex: {
    'foo+': { action: 'respond', response: 'regex' }
  }
}));

const performAction = require('../../../../botactions/eventHandling/messageEvents/actionPerformer');
const handleFiltering = require('../../../../botactions/eventHandling/messageEvents/filterHandler');

describe('handleFiltering', () => {
  let message, client;
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    message = { content: 'foo bad', author: { id: 'u1', username: 'User' }, channel: { send: jest.fn() } };
    client = {};
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  test('triggers personal action when phrase matches', async () => {
    await handleFiltering({ ...message, content: 'personal' }, client);
    expect(performAction).toHaveBeenCalled();
  });

  test('triggers regex action', async () => {
    await handleFiltering({ ...message, content: 'foooo' }, client);
    expect(performAction).toHaveBeenCalled();
  });

  test('does nothing when no matches', async () => {
    await handleFiltering({ ...message, content: 'clean' }, client);
    expect(performAction).not.toHaveBeenCalled();
  });

  test('returns early on regular trigger', async () => {
    performAction.mockReturnValueOnce(true);
    await handleFiltering({ ...message, content: 'bad foooo' }, client);
    expect(performAction).toHaveBeenCalledTimes(1);
    expect(performAction).toHaveBeenCalledWith(expect.any(Object), client, expect.objectContaining({ response: 'no' }));
  });

  test('returns early on regex trigger', async () => {
    performAction.mockReturnValueOnce(true);
    await handleFiltering({ ...message, content: 'foooo' }, client);
    expect(performAction).toHaveBeenCalledTimes(1);
    expect(performAction).toHaveBeenCalledWith(expect.any(Object), client, expect.objectContaining({ response: 'regex' }));
  });

  test('personal action can return true', async () => {
    performAction.mockReturnValueOnce(true);
    await handleFiltering({ ...message, content: 'personal' }, client);
    expect(performAction).toHaveBeenCalledTimes(1);
    expect(performAction).toHaveBeenCalledWith(expect.any(Object), client, expect.objectContaining({ response: 'hey' }));
  });
});
