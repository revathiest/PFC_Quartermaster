const first = require('../../utils/pendingSelections');
const second = require('../../utils/pendingSelections');

describe('pending selections exports', () => {
  test('channel selection is singleton', () => {
    expect(first.pendingChannelSelection).toBe(second.pendingChannelSelection);
    expect(first.pendingChannelSelection).toEqual({});
    first.pendingChannelSelection.foo = 'bar';
    expect(second.pendingChannelSelection.foo).toBe('bar');
  });

  test('poi uploads is singleton', () => {
    expect(first.pendingPoiUploads).toBe(second.pendingPoiUploads);
    expect(first.pendingPoiUploads).toEqual({});
    first.pendingPoiUploads.foo = 'baz';
    expect(second.pendingPoiUploads.foo).toBe('baz');
  });
});
