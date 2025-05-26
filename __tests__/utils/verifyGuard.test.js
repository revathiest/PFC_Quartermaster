jest.mock('../../config/database', () => require('../../__mocks__/config/database'));

const { isUserVerified } = require('../../utils/verifyGuard');
const { VerifiedUser } = require('../../config/database');

describe('isUserVerified', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns true when record exists', async () => {
    VerifiedUser.findByPk.mockResolvedValue({ id: '1' });
    await expect(isUserVerified('1')).resolves.toBe(true);
  });

  test('returns false when no record', async () => {
    VerifiedUser.findByPk.mockResolvedValue(null);
    await expect(isUserVerified('1')).resolves.toBe(false);
  });

  test('propagates database errors', async () => {
    VerifiedUser.findByPk.mockRejectedValue(new Error('db'));
    await expect(isUserVerified('1')).rejects.toThrow('db');
  });
});
