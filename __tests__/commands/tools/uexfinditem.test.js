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

test('handleSelect builds table', async () => {
  isUserVerified.mockResolvedValue(true);
  db.UexItemPrice.findAll.mockResolvedValue([]);
  db.UexCommodityPrice.findAll.mockResolvedValue([{ id_commodity: 1, commodity_name: 'med', price_buy: 10, price_sell: 0, terminal: { name: 'T1' } }]);
  const i = makeInteraction();
  await command.execute(i);
  const select = i.editReply.mock.calls[0][0].components;
  expect(select).toBeDefined();
});

test('button forwards to handleSelection', async () => {
  const i = { customId: 'uexfinditem::commodity::1::0', deferUpdate: jest.fn(), editReply: jest.fn() };
  db.UexCommodityPrice.findAll.mockResolvedValue([{ price_buy: 5, price_sell: 6, terminal: { name: 'X' } }]);
  await command.button(i);
  expect(i.editReply).toHaveBeenCalled();
});

