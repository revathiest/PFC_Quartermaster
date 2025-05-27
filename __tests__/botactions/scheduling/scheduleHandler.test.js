jest.mock('../../../config/database', () => ({
  ScheduledAnnouncement: {
    create: jest.fn(),
    findAll: jest.fn(),
    destroy: jest.fn()
  }
}));

jest.mock('../../../botactions/utilityFunctions', () => ({
  getChannelNameById: jest.fn(),
  getGuildNameById: jest.fn()
}));

const db = require('../../../config/database');
const utils = require('../../../botactions/utilityFunctions');
const {
  saveAnnouncementToDatabase,
  getScheduledAnnouncements,
  deleteScheduledAnnouncement
} = require('../../../botactions/scheduling/scheduleHandler');

describe('scheduleHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('saveAnnouncementToDatabase stores and logs', async () => {
    utils.getChannelNameById.mockResolvedValue('chan');
    utils.getGuildNameById.mockResolvedValue('guild');
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    await saveAnnouncementToDatabase('c1', 'g1', { title: 't' }, 'time', {});

    expect(db.ScheduledAnnouncement.create).toHaveBeenCalledWith({
      channelId: 'c1',
      guildId: 'g1',
      embedData: JSON.stringify({ title: 't' }),
      time: 'time'
    });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  test('getScheduledAnnouncements returns records', async () => {
    db.ScheduledAnnouncement.findAll.mockResolvedValue(['a']);
    const res = await getScheduledAnnouncements();
    expect(res).toEqual(['a']);
  });

  test('getScheduledAnnouncements returns empty array on error', async () => {
    db.ScheduledAnnouncement.findAll.mockRejectedValue(new Error('fail'));
    const res = await getScheduledAnnouncements();
    expect(res).toEqual([]);
  });

  test('deleteScheduledAnnouncement deletes record', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    await deleteScheduledAnnouncement(5);
    expect(db.ScheduledAnnouncement.destroy).toHaveBeenCalledWith({ where: { id: 5 } });
    log.mockRestore();
  });
});
