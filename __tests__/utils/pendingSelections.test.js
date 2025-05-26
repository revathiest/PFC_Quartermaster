const first = require('../../utils/pendingSelections');
const second = require('../../utils/pendingSelections');

describe('pendingChannelSelection', () => {
  test('exports singleton object', () => {
    expect(first.pendingChannelSelection).toBe(second.pendingChannelSelection);
    expect(first.pendingChannelSelection).toEqual({});
    first.pendingChannelSelection.foo = 'bar';
    expect(second.pendingChannelSelection.foo).toBe('bar');
  });
});
