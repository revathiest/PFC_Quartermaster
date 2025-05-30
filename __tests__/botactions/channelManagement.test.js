jest.mock('../../botactions/channelManagement/channelRegistry', () => ({ registerChannels: jest.fn() }));
jest.mock('../../botactions/channelManagement/messageCleanup', () => ({ deleteMessages: jest.fn() }));
jest.mock('../../botactions/channelManagement/snapChannels', () => ({
  addSnapChannel: jest.fn(),
  removeSnapChannel: jest.fn(),
  listSnapChannels: jest.fn()
}));

const registry = require('../../botactions/channelManagement/channelRegistry');
const cleanup = require('../../botactions/channelManagement/messageCleanup');
const snaps = require('../../botactions/channelManagement/snapChannels');
const cm = require('../../botactions/channelManagement');

describe('channelManagement exports', () => {
  test('re-exports underlying functions', async () => {
    await cm.registerChannels('client');
    await cm.deleteMessages('client');
    await cm.addSnapChannel('id');
    await cm.removeSnapChannel('id');
    await cm.listSnapChannels();

    expect(registry.registerChannels).toHaveBeenCalledWith('client');
    expect(cleanup.deleteMessages).toHaveBeenCalledWith('client');
    expect(snaps.addSnapChannel).toHaveBeenCalledWith('id');
    expect(snaps.removeSnapChannel).toHaveBeenCalledWith('id');
    expect(snaps.listSnapChannels).toHaveBeenCalled();
  });
});
