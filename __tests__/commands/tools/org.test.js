jest.mock('node-fetch');
jest.mock('../../../config.json', () => ({ botPermsReq: 0 }), { virtual: true });

const fetch = require('node-fetch');
const command = require('../../../commands/tools/org');
const { MessageFlags } = require('../../../__mocks__/discord.js');

const makeInteraction = () => ({
  options: { _hoistedOptions: [{ value: 'pfc' }] },
  reply: jest.fn(),
});

afterEach(() => jest.clearAllMocks());

test('replies with org info when found', async () => {
  fetch.mockResolvedValue({ text: jest.fn().mockResolvedValue(JSON.stringify({ data: { name: 'PFC', url: 'u', headline: { plaintext: 'bio' }, logo: 'l', members: 1, recruiting: true } })) });
  const i = makeInteraction();
  await command.execute(i);
  expect(i.reply).toHaveBeenCalledWith(expect.objectContaining({ flags: MessageFlags.Ephemeral }));
});

test('handles org not found', async () => {
  fetch.mockResolvedValue({ text: jest.fn().mockResolvedValue(JSON.stringify({ message: 'not found' })) });
  const i = makeInteraction();
  await command.execute(i);
  expect(i.reply).toHaveBeenCalledWith({ content: 'not found', flags: MessageFlags.Ephemeral });
});

