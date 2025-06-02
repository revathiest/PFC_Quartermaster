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


test('single match selects automatically', async () => {
  isUserVerified.mockResolvedValue(true);
  db.UexItemPrice.findAll.mockResolvedValueOnce([{ id_item: 1, item_name: 'med' }]);
  db.UexCommodityPrice.findAll.mockResolvedValue([]);
  db.UexVehiclePurchasePrice.findAll.mockResolvedValue([]);
  // results for handleSelection
  db.UexItemPrice.findAll.mockResolvedValueOnce([{ price_buy: 5, price_sell: 6, terminal: { name: 'T' } }]);
  const i = makeInteraction();
  await command.execute(i);
  expect(i.editReply).toHaveBeenCalledWith(expect.objectContaining({ embeds: expect.any(Array) }));
});

test('handleSelection no records found', async () => {
  const i = { customId: 'uexfinditem::item::1::0', deferUpdate: jest.fn(), editReply: jest.fn() };
  db.UexItemPrice.findAll.mockResolvedValue([]);
  await command.button(i);
  expect(i.editReply).toHaveBeenCalledWith('No location data found for that entry.');
});

test('pagination generates nav buttons', async () => {
  const i = { customId: 'uexfinditem::commodity::1::1', deferUpdate: jest.fn(), editReply: jest.fn() };
  const records = [];
  for (let x = 0; x < 25; x++) records.push({ price_buy: 1, price_sell: 0, terminal: { name: 'T' + x } });
  db.UexCommodityPrice.findAll.mockResolvedValue(records);
  await command.button(i);
  const row = i.editReply.mock.calls[0][0].components[0];
  const first = row.addComponents.mock.calls[0][0];
  const second = row.addComponents.mock.calls[0][1];
  expect(first.data.disabled).toBe(false);
  expect(second.data.disabled).toBe(true);
});

test('pagination previous page', async () => {
  const i = { customId: 'uexfinditem::commodity::1::0', deferUpdate: jest.fn(), editReply: jest.fn() };
  const records = Array.from({ length: 15 }, () => ({ price_buy: 1, price_sell: 0, terminal: { name: 'T' } }));
  db.UexCommodityPrice.findAll.mockResolvedValue(records);
  await command.button(i);
  expect(i.editReply).toHaveBeenCalled();
});
