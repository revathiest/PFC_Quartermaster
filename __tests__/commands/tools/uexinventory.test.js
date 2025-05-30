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

