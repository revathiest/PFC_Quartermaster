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

test('prompts selection when multiple matches', async () => {
  isUserVerified.mockResolvedValue(true);
  const i = makeInteraction();
  db.Vehicle.findOne.mockResolvedValue(null);
  db.Vehicle.findAll.mockResolvedValue([{ uuid: '1', name: 'Ship', version: 'v' }]);
  i.channel.awaitMessageComponent.mockResolvedValue({ deferUpdate: jest.fn(), values: ['1'] });
  db.Vehicle.findByPk.mockResolvedValue({ uuid: '1', updated_at: new Date(), name: 'Ship' });
  db.VehicleDetail.findByPk.mockResolvedValue({ uuid: '1', name: 'Ship', updated_at: new Date() });

  await command.execute(i);

  expect(i.channel.awaitMessageComponent).toHaveBeenCalled();
  expect(i.editReply).toHaveBeenCalled();
});

test('fetches detail when outdated', async () => {
  isUserVerified.mockResolvedValue(true);
  const i = makeInteraction();
  const old = new Date(Date.now() - 1000);
  db.Vehicle.findOne.mockResolvedValue({ uuid: '1', updated_at: new Date(), name: 'Ship', link: 'u' });
  db.VehicleDetail.findByPk.mockResolvedValue({ uuid: '1', updated_at: old });
  const { fetchSCDataByUrl } = require('../../../utils/fetchSCData');
  fetchSCDataByUrl.mockResolvedValue({ data: { uuid: '1', name: 'Ship', updated_at: new Date(), version: 'v' } });
  db.VehicleDetail.upsert.mockResolvedValue();

  await command.execute(i);

  expect(fetchSCDataByUrl).toHaveBeenCalled();
});

test('logs error when fetch fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  isUserVerified.mockResolvedValue(true);
  const i = makeInteraction();
  const old = new Date(Date.now() - 1000);
  db.Vehicle.findOne.mockResolvedValue({ uuid: '1', updated_at: new Date(), name: 'Ship', link: 'u' });
  db.VehicleDetail.findByPk.mockResolvedValue({ uuid: '1', updated_at: old });
  const { fetchSCDataByUrl } = require('../../../utils/fetchSCData');
  fetchSCDataByUrl.mockRejectedValue(new Error('fail'));
  await command.execute(i);
  expect(console.error).toHaveBeenCalled();
  expect(i.editReply).toHaveBeenCalledWith('❌ Failed to fetch or store updated vehicle details.');
});

