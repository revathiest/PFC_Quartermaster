jest.mock('../../../utils/verifyGuard');
jest.mock('../../../config/database', () => ({
  UexTerminal: { findAll: jest.fn(), findByPk: jest.fn() },
  UexItemPrice: { findAll: jest.fn() },
  UexCommodityPrice: { findAll: jest.fn() },
  UexFuelPrice: { findAll: jest.fn() },
  UexVehiclePurchasePrice: { findAll: jest.fn() },
  UexVehicleRentalPrice: { findAll: jest.fn() },
}));

const { isUserVerified } = require('../../../utils/verifyGuard');
const db = require('../../../config/database');
const command = require('../../../commands/tools/uexinventory');

const makeInteraction = () => ({
  options: { getString: jest.fn(() => 'Area18') },
  user: { id: '1' },
  reply: jest.fn(),
  update: jest.fn(),
  deferReply: jest.fn(),
  deferUpdate: jest.fn(),
});

beforeEach(() => jest.clearAllMocks());

test('rejects when user not verified', async () => {
  isUserVerified.mockResolvedValue(false);
  const i = makeInteraction();
  await command.execute(i);
  expect(i.reply).toHaveBeenCalledWith(expect.objectContaining({ flags: expect.any(Number) }));
});

test('no terminals found', async () => {
  isUserVerified.mockResolvedValue(true);
  db.UexTerminal.findAll.mockResolvedValue([]);
  const i = makeInteraction();
  await command.execute(i);
  expect(i.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('No terminals found') }));
});

test('lists terminal types when found', async () => {
  isUserVerified.mockResolvedValue(true);
  db.UexTerminal.findAll.mockResolvedValue([{ id: 1, type: 'store', name: 't' }]);
  const i = makeInteraction();
  await command.execute(i);
  expect(i.reply).toHaveBeenCalledWith(expect.objectContaining({ components: expect.any(Array) }));
});

test('option selects terminal', async () => {
  const i = makeInteraction();
  i.customId = 'uexinventory_type::Area18';
  i.values = ['store'];
  db.UexTerminal.findAll.mockResolvedValue([{ id: 1, type: 'store', name: 't' }]);
  await command.option(i);
  expect(i.update).toHaveBeenCalled();
});

test('button shows inventory', async () => {
  const i = { customId: 'uexinventory_prev::1::item::1::false', reply: jest.fn(), update: jest.fn(), channel: { send: jest.fn() }, deferUpdate: jest.fn() };
  db.UexTerminal.findByPk.mockResolvedValue({ id: 1, name: 'term' });
  db.UexItemPrice.findAll.mockResolvedValue([{ item_name: 'thing', price_buy: 1, price_sell: 2 }]);
  await command.button(i);
  expect(i.update).toHaveBeenCalled();
});


test('option handles missing terminal', async () => {
  const i = makeInteraction();
  i.customId = 'uexinventory_terminal';
  i.values = ['uexinventory_terminal::99::item'];
  db.UexTerminal.findByPk.mockResolvedValue(null);
  await command.option(i);
  expect(i.update).toHaveBeenCalledWith(expect.objectContaining({ content: '❌ Terminal not found.' }));
});

test('option returns inventory embed', async () => {
  const i = makeInteraction();
  i.customId = 'uexinventory_terminal';
  i.values = ['uexinventory_terminal::1::item'];
  db.UexTerminal.findByPk.mockResolvedValue({ id: 1, name: 'term' });
  db.UexItemPrice.findAll.mockResolvedValue([{ item_name: 'a', price_buy: 1, price_sell: 2 }]);
  await command.option(i);
  expect(i.update).toHaveBeenCalledWith(expect.objectContaining({ embeds: expect.any(Array) }));
});

test('button with unknown type replies error', async () => {
  const i = { customId: 'uexinventory_prev::1::bad::0::false', reply: jest.fn(), update: jest.fn(), channel: { send: jest.fn() }, deferUpdate: jest.fn() };
  db.UexTerminal.findByPk.mockResolvedValue({ id: 1, name: 'term' });
  await command.button(i);
  expect(i.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Unsupported terminal type') }));
});

test('button public posts to channel', async () => {
  const i = { customId: 'uexinventory_public::1::item::0::false', reply: jest.fn(), update: jest.fn(), channel: { send: jest.fn() }, deferUpdate: jest.fn() };
  db.UexTerminal.findByPk.mockResolvedValue({ id: 1, name: 'term' });
  db.UexItemPrice.findAll.mockResolvedValue([{ item_name: 'x', price_buy: 1 }]);
  await command.button(i);
  expect(i.channel.send).toHaveBeenCalled();
  expect(i.update).toHaveBeenCalled();
});

test('button replies when no inventory records', async () => {
  const i = { customId: 'uexinventory_prev::1::item::0::false', reply: jest.fn(), update: jest.fn(), channel: { send: jest.fn() }, deferUpdate: jest.fn() };
  db.UexTerminal.findByPk.mockResolvedValue({ id: 1, name: 'term' });
  db.UexItemPrice.findAll.mockResolvedValue([]);
  await command.button(i);
  expect(i.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('No inventory data') }));
});

test('button fuel type shows header and pagination', async () => {
  const i = { customId: 'uexinventory_next::1::fuel::0::false', reply: jest.fn(), update: jest.fn(), channel: { send: jest.fn() }, deferUpdate: jest.fn() };
  db.UexTerminal.findByPk.mockResolvedValue({ id: 1, name: 'FuelTerm' });
  const records = Array.from({ length: 12 }, () => ({ commodity_name: 'fuel', price_buy: 1 }));
  db.UexFuelPrice.findAll.mockResolvedValue(records);
  await command.button(i);
  const embed = i.update.mock.calls[0][0].embeds[0];
  expect(embed.data.description).toContain('Fuel Type');
  const row = i.update.mock.calls[0][0].components[0];
  expect(row.addComponents).toHaveBeenCalled();
});

test('button vehicle rent adds make public button', async () => {
  const i = { customId: 'uexinventory_prev::1::vehicle_rent::1::false', reply: jest.fn(), update: jest.fn(), channel: { send: jest.fn() }, deferUpdate: jest.fn() };
  db.UexTerminal.findByPk.mockResolvedValue({ id: 1, name: 'term' });
  db.UexVehicleRentalPrice.findAll.mockResolvedValue([{ vehicle_name: 'bike', price_rent: 2 }]);
  await command.button(i);
  const components = i.update.mock.calls[0][0].components;
  expect(components[components.length - 1].addComponents).toHaveBeenCalled();
});
