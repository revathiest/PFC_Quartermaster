jest.mock('../../../utils/verifyGuard');
jest.mock('../../../config/database', () => ({
  Vehicle: { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn() },
  VehicleDetail: { findByPk: jest.fn(), upsert: jest.fn() },
}));
jest.mock('../../../utils/fetchSCData');

const { isUserVerified } = require('../../../utils/verifyGuard');
const db = require('../../../config/database');
const command = require('../../../commands/tools/shipdetails');

const makeInteraction = () => ({
  options: { getString: jest.fn(() => 'ship') },
  user: { id: '1' },
  guild: {},
  deferReply: jest.fn(),
  editReply: jest.fn(),
  reply: jest.fn(),
  channel: { awaitMessageComponent: jest.fn() },
});

beforeEach(() => jest.clearAllMocks());

test('rejects unverified user', async () => {
  isUserVerified.mockResolvedValue(false);
  const i = makeInteraction();
  await command.execute(i);
  expect(i.reply).toHaveBeenCalledWith({
    content: expect.stringContaining('verify'),
    flags: expect.any(Number),
  });
});

test('shows vehicle detail when found', async () => {
  isUserVerified.mockResolvedValue(true);
  const i = makeInteraction();
  db.Vehicle.findOne.mockResolvedValue({ uuid: '1', updated_at: new Date(), name: 'Ship' });
  db.VehicleDetail.findByPk.mockResolvedValue({ uuid: '1', name: 'Ship', updated_at: new Date() });

  await command.execute(i);

  expect(i.deferReply).toHaveBeenCalled();
  const embed = i.editReply.mock.calls[0][0].embeds[0];
  expect(embed.title).toContain('Ship');
});

