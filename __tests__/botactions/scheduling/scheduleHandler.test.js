jest.mock('../../../config/database', () => ({
  ScheduledAnnouncement: {
    create: jest.fn(),
    findAll: jest.fn(),
    destroy: jest.fn(),
  }
}));

jest.mock('../../../botactions/utilityFunctions', () => ({
  getChannelNameById: jest.fn(() => Promise.resolve('general')),
  getGuildNameById: jest.fn(() => Promise.resolve('Test Guild')),
}));

const { saveAnnouncementToDatabase, getScheduledAnnouncements, deleteScheduledAnnouncement } = require('../../../botactions/scheduling/scheduleHandler');
const { ScheduledAnnouncement } = require('../../../config/database');
const { getChannelNameById, getGuildNameById } = require('../../../botactions/utilityFunctions');

describe('scheduleHandler database operations', () => {
  const mockClient = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('saveAnnouncementToDatabase stores record and resolves names', async () => {
    ScheduledAnnouncement.create.mockResolvedValue({});

    await saveAnnouncementToDatabase('123', 'guild1', { title: 'Test', description: 'Desc' }, 1111, mockClient);

    expect(ScheduledAnnouncement.create).toHaveBeenCalledWith({
      channelId: '123',
      guildId: 'guild1',
      embedData: JSON.stringify({ title: 'Test', description: 'Desc' }),
      time: '1111'
    });
    expect(getChannelNameById).toHaveBeenCalledWith('123', mockClient);
    expect(getGuildNameById).toHaveBeenCalledWith('guild1', mockClient);
  });

  test('getScheduledAnnouncements returns records', async () => {
    ScheduledAnnouncement.findAll.mockResolvedValue([{ id: 1 }]);
    const result = await getScheduledAnnouncements();
    expect(ScheduledAnnouncement.findAll).toHaveBeenCalled();
    expect(result).toEqual([{ id: 1 }]);
  });

  test('deleteScheduledAnnouncement removes record by id', async () => {
    ScheduledAnnouncement.destroy.mockResolvedValue(1);
    await deleteScheduledAnnouncement(7);
    expect(ScheduledAnnouncement.destroy).toHaveBeenCalledWith({ where: { id: 7 } });
  });
});
