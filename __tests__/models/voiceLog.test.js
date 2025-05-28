const defineVoiceLog = require('../../models/voiceLog');

describe('VoiceLog model', () => {
  test('defines fields and options', () => {
    const define = jest.fn(() => ({}));
    const sequelize = { define };
    const model = defineVoiceLog(sequelize);
    const [name, attrs] = define.mock.calls[0];
    expect(name).toBe('VoiceLog');
    expect(attrs).toHaveProperty('user_id');
    expect(attrs).toHaveProperty('event_type');
    expect(attrs).toHaveProperty('server_id');
    expect(model).toEqual({});
  });
});
