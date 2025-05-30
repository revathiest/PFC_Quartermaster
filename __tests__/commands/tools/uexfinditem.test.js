jest.mock('../../../utils/verifyGuard');
jest.mock('../../../config/database', () => ({
  UexItemPrice: { findAll: jest.fn() },
  UexCommodityPrice: { findAll: jest.fn() },
  UexVehiclePurchasePrice: { findAll: jest.fn() },
  UexTerminal: { findAll: jest.fn() },
}));

const { isUserVerified } = require('../../../utils/verifyGuard');
const db = require('../../../config/database');
const command = require('../../../commands/tools/uexfinditem');

const makeInteraction = () => ({
  options: { getString: jest.fn(() => 'med') },
  user: { id: '1' },
  deferReply: jest.fn(),
  editReply: jest.fn(),
  reply: jest.fn(),
});

beforeEach(() => jest.clearAllMocks());

test('rejects when user not verified', async () => {
  isUserVerified.mockResolvedValue(false);
  const i = makeInteraction();
  await command.execute(i);
  expect(i.reply).toHaveBeenCalledWith(expect.objectContaining({ flags: expect.any(Number) }));
});

test('responds with no matches', async () => {
  isUserVerified.mockResolvedValue(true);
  db.UexItemPrice.findAll.mockResolvedValue([]);
  db.UexCommodityPrice.findAll.mockResolvedValue([]);
  db.UexVehiclePurchasePrice.findAll.mockResolvedValue([]);
  const i = makeInteraction();
  await command.execute(i);
  expect(i.editReply).toHaveBeenCalledWith('No matches found. Try refining your search.');
});

