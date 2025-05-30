jest.mock('../../botactions/scheduling/eventReminder', () => ({ checkEvents: jest.fn() }));
jest.mock('../../botactions/scheduling/scheduledAnnouncementEngine', () => ({ startScheduledAnnouncementEngine: jest.fn() }));

const scheduling = require('../../botactions/scheduling');
const eventReminder = require('../../botactions/scheduling/eventReminder');
const announcementEngine = require('../../botactions/scheduling/scheduledAnnouncementEngine');

describe('scheduling exports', () => {
  test('re-exports underlying functions', () => {
    expect(scheduling.checkEvents).toBe(eventReminder.checkEvents);
    expect(scheduling.startScheduledAnnouncementEngine).toBe(announcementEngine.startScheduledAnnouncementEngine);
  });
});
