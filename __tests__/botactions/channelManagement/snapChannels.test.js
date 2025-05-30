jest.mock('../../../config/database', () => ({
  SnapChannel: {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn()
  }
}));

const db = require('../../../config/database');
const {
  addSnapChannel,
  removeSnapChannel,
  listSnapChannels
} = require('../../../botactions/channelManagement/snapChannels');

describe('snapChannels', () => {
  beforeEach(() => jest.clearAllMocks());

  test('addSnapChannel logs on success', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    await addSnapChannel('c1', 7, 'g1');
    expect(db.SnapChannel.create).toHaveBeenCalledWith({ channelId: 'c1', purgeTimeInDays: 7, serverId: 'g1' });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  test('addSnapChannel logs error on failure', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    db.SnapChannel.create.mockRejectedValue(new Error('fail'));
    await addSnapChannel('c1', 7, 'g1');
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  test('removeSnapChannel destroys when found', async () => {
    const destroy = jest.fn();
    db.SnapChannel.findOne.mockResolvedValue({ destroy });
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    await removeSnapChannel('c2');
    expect(db.SnapChannel.findOne).toHaveBeenCalledWith({ where: { channelId: 'c2' } });
    expect(destroy).toHaveBeenCalled();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  test('removeSnapChannel logs not found', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    db.SnapChannel.findOne.mockResolvedValue(null);
    await removeSnapChannel('c2');
    expect(log).toHaveBeenCalledWith('Channel c2 not found.');
    log.mockRestore();
  });

  test('removeSnapChannel logs error on failure', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    db.SnapChannel.findOne.mockRejectedValue(new Error('fail'));
    await removeSnapChannel('c2');
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  test('listSnapChannels returns value', async () => {
    db.SnapChannel.findAll.mockResolvedValue(['a']);
    const res = await listSnapChannels({ where: {}});
    expect(res).toEqual(['a']);
    expect(db.SnapChannel.findAll).toHaveBeenCalledWith({ where: {}});
  });

  test('listSnapChannels throws on error', async () => {
    db.SnapChannel.findAll.mockRejectedValue(new Error('fail'));
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(listSnapChannels()).rejects.toThrow('fail');
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
