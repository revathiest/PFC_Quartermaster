jest.mock('../../../../config/database', () => ({
  HuntPoi: { findAll: jest.fn(), findByPk: jest.fn() },
  Hunt: { findOne: jest.fn() },
  HuntSubmission: { create: jest.fn(), findOne: jest.fn() },
  Config: { findOne: jest.fn() }
}));
jest.mock('../../../../utils/hunt', () => ({ getActiveHunt: jest.fn() }));

const { HuntPoi, Hunt, HuntSubmission, Config } = require('../../../../config/database');
const { getActiveHunt } = require('../../../../utils/hunt');
jest.mock('../../../../utils/googleDrive', () => ({
  createDriveClient: jest.fn(() => ({ files: { create: jest.fn() } })),
  uploadScreenshot: jest.fn(() => ({ id: 'f', webViewLink: 'link' }))
}));
const { createDriveClient, uploadScreenshot } = require('../../../../utils/googleDrive');
jest.mock('node-fetch');
const fetch = require('node-fetch');
const command = require('../../../../commands/hunt/poi/list');
const { MessageFlags } = require('../../../../__mocks__/discord.js');
const { Collection } = require('@discordjs/collection');

const makeInteraction = (roles = []) => ({
  reply: jest.fn(),
  editReply: jest.fn(),
  deferReply: jest.fn().mockImplementation(function () {
    this.deferred = true;
    return Promise.resolve();
  }),
  member: {
    roles: {
      cache: {
        map: (fn) => roles.map(r => fn({ name: r }))
      }
    }
  }
});

beforeEach(() => {
  jest.clearAllMocks();
});

test('replies when no pois exist', async () => {
  HuntPoi.findAll.mockResolvedValue([]);
  const interaction = makeInteraction();

  await command.execute(interaction);

  expect(interaction.deferReply).toHaveBeenCalled();
  expect(interaction.editReply).toHaveBeenCalledWith({
    content: '❌ No POIs found.',
    flags: MessageFlags.Ephemeral
  });
});

test('lists pois when present', async () => {
  HuntPoi.findAll.mockResolvedValue([
    { name: 'A', points: 5, hint: 'h1' },
    { name: 'B', points: 10, hint: 'h2' }
  ]);
  const interaction = makeInteraction();

  await command.execute(interaction);

  expect(interaction.deferReply).toHaveBeenCalled();
  const reply = interaction.editReply.mock.calls[0][0];
  expect(reply.embeds[0].data.title).toContain('Points of Interest');
  expect(reply.embeds[0].data.footer.text).toContain('Page 1 of 1');
  expect(reply.flags).toBe(MessageFlags.Ephemeral);
});

test('handles fetch errors', async () => {
  const err = new Error('fail');
  HuntPoi.findAll.mockRejectedValue(err);
  const interaction = makeInteraction();
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

  await command.execute(interaction);

  expect(spy).toHaveBeenCalled();
  expect(interaction.deferReply).toHaveBeenCalled();
  expect(interaction.reply).toHaveBeenCalledWith({
    content: '❌ Error fetching POIs.',
    flags: MessageFlags.Ephemeral
  });
  spy.mockRestore();
});

test('button paginates results', async () => {
  const pois = Array.from({ length: 11 }, (_, i) => ({ name: `P${i}`, points: i, hint: 'h' }));
  HuntPoi.findAll.mockResolvedValue(pois);
  const interaction = {
    customId: 'hunt_poi_page::1',
    deferUpdate: jest.fn().mockImplementation(function () { this.deferred = true; return Promise.resolve(); }),
    editReply: jest.fn(),
    reply: jest.fn(),
    deferred: false,
    replied: false
  };

  await command.button(interaction);

  expect(interaction.deferUpdate).toHaveBeenCalled();
  const embed = interaction.editReply.mock.calls[0][0].embeds[0];
  expect(embed.data.footer.text).toContain('Page 2 of');
});

test('admin sees select menu', async () => {
  HuntPoi.findAll.mockResolvedValue([
    { id: '1', name: 'Alpha', points: 5, hint: 'h1' }
  ]);
  const interaction = makeInteraction(['Admiral']);

  await command.execute(interaction);

  expect(interaction.deferReply).toHaveBeenCalled();
  const reply = interaction.editReply.mock.calls[0][0];
  expect(reply.components.length).toBeGreaterThan(0);
});

test('non-admin sees select menu', async () => {
  HuntPoi.findAll.mockResolvedValue([{ id:'1', name:'Alpha', points:1, hint:'h' }]);
  const interaction = makeInteraction();
  await command.execute(interaction);
  const reply = interaction.editReply.mock.calls[0][0];
  expect(reply.components.length).toBeGreaterThan(0);
});

test('select menu highlights poi', async () => {
  HuntPoi.findAll.mockResolvedValue([
    { id: '1', name: 'Alpha', points: 5, hint: 'h1' }
  ]);
  const interaction = {
    customId: 'hunt_poi_select::0',
    values: ['1'],
    deferUpdate: jest.fn().mockImplementation(function () { this.deferred = true; return Promise.resolve(); }),
    editReply: jest.fn(),
    member: { roles: { cache: { map: fn => ['Admiral'].map(r => fn({ name: r })) } } },
    reply: jest.fn(),
    deferred: false,
    replied: false
  };

  await command.option(interaction);

  expect(interaction.deferUpdate).toHaveBeenCalled();
  const embed = interaction.editReply.mock.calls[0][0].embeds[0];
  expect(embed.data.fields[0].name).toContain('Alpha');
  expect(interaction.editReply.mock.calls[0][0].components.length).toBeGreaterThan(1);
});

test('edit button replies when poi missing', async () => {
  HuntPoi.findByPk = jest.fn().mockResolvedValue(null);
  const interaction = {
    customId: 'hunt_poi_edit::1::0',
    deferUpdate: jest.fn(() => Promise.resolve()),
    showModal: jest.fn(),
    followUp: jest.fn(),
    user: { id: 'u' }
  };

  await command.button(interaction);

  expect(interaction.followUp).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('POI not found') }));
  expect(interaction.deferUpdate).not.toHaveBeenCalled();
});

test('edit button shows modal when poi exists', async () => {
  HuntPoi.findByPk = jest.fn().mockResolvedValue({ id: '1', name: 'X', description: '', hint: '', location: '', image_url: '', points: 1 });
  const interaction = {
    customId: 'hunt_poi_edit::1::0',
    deferUpdate: jest.fn(() => Promise.resolve()),
    showModal: jest.fn(() => Promise.resolve()),
    followUp: jest.fn(),
    user: { id: 'u' }
  };

  await command.button(interaction);

  expect(interaction.showModal).toHaveBeenCalled();
  const modal = interaction.showModal.mock.calls[0][0];
  expect(modal.setTitle).toHaveBeenCalledWith(expect.stringContaining('X'));
  expect(modal.addComponents.mock.calls[0].length).toBe(5);
  expect(interaction.deferUpdate).not.toHaveBeenCalled();
});

test('archive button archives poi', async () => {
  const update = jest.fn();
  HuntPoi.findByPk = jest.fn().mockResolvedValue({ update });
  const interaction = {
    customId: 'hunt_poi_archive::1::0',
    deferUpdate: jest.fn(() => Promise.resolve()),
    followUp: jest.fn(),
    member: { roles: { cache: { map: fn => ['Admiral'].map(r => fn({ name: r })) } } },
    user: { id: 'u' }
  };

  await command.button(interaction);

  expect(update).toHaveBeenCalledWith({ status: 'archived', updated_by: 'u' });
});

test('archive button replies when poi missing', async () => {
  HuntPoi.findByPk = jest.fn().mockResolvedValue(null);
  const interaction = { customId: 'hunt_poi_archive::2::0', deferUpdate: jest.fn(() => Promise.resolve()), followUp: jest.fn(), user: { id: 'u' } };
  await command.button(interaction);
  expect(interaction.followUp).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('POI not found') }));
});

test('pagination error is logged', async () => {
  HuntPoi.findAll.mockRejectedValue(new Error('fail'));
  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const interaction = { customId: 'hunt_poi_page::1', deferUpdate: jest.fn(() => Promise.resolve()), editReply: jest.fn(), member: { roles: { cache: { map: fn => [] } } } };
  await command.button(interaction);
  expect(errSpy).toHaveBeenCalled();
});

test('modal updates poi information', async () => {
  const update = jest.fn(() => Promise.resolve());
  HuntPoi.findByPk = jest.fn().mockResolvedValue({ update });
  const fields = { getTextInputValue: jest.fn(id => (id === 'points' ? '2' : 'val')) };
  const interaction = {
    customId: 'hunt_poi_edit_form::1',
    fields,
    user: { id: 'u' },
    reply: jest.fn()
  };

  await command.modal(interaction);

  expect(update).toHaveBeenCalledWith(expect.objectContaining({
    description: 'val',
    hint: 'val',
    location: 'val',
    image_url: 'val',
    points: 2,
    updated_by: 'u'
  }));
  expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: '✅ POI updated.' }));
});

test('modal handles update failure', async () => {
  const update = jest.fn(() => Promise.reject(new Error('fail')));
  HuntPoi.findByPk = jest.fn().mockResolvedValue({ update });

  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const fields = { getTextInputValue: jest.fn(() => 'val') };
  fields.getTextInputValue.mockImplementation(id => id === 'points' ? '2' : 'val');
  const interaction = { customId: 'hunt_poi_edit_form::1', fields, user: { id: 'u' }, reply: jest.fn() };

  await command.modal(interaction);

  expect(errSpy).toHaveBeenCalled();
  expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: '❌ Failed to update POI.' }));
});

test('submit button processes uploaded screenshot', async () => {
  getActiveHunt.mockResolvedValue({ id: 'h1' });
  Config.findOne
    .mockResolvedValueOnce({ value: 'a' })
    .mockResolvedValueOnce({ value: 'r' });
  HuntSubmission.create.mockResolvedValue({ id: 's1', update: jest.fn(), image_url: 'link' });
  HuntSubmission.findOne.mockResolvedValue({ id: 'prev1' });
  HuntPoi.findByPk = jest.fn().mockResolvedValue({ name: 'Alpha Beta' });
  const activityCh = { send: jest.fn() };
  const reviewCh = { send: jest.fn().mockResolvedValue({ id: 'm' }) };
  const client = { channels: { fetch: jest.fn(id => (id === 'a' ? activityCh : reviewCh)) } };
  fetch.mockResolvedValue({ ok: true, buffer: async () => Buffer.from('img'), headers: { get: () => 'image/png' } });
  const message = {
    attachments: new Collection([['1', { url: 'http://img', contentType: 'image/png' }]]),
    author: { id: 'u' },
    delete: jest.fn()
  };
  const awaitMessages = jest.fn().mockResolvedValue(new Collection([['1', message]]));
  process.env.GOOGLE_DRIVE_HUNT_FOLDER = 'root';
  const interaction = {
    customId: 'hunt_poi_submit::1::0',
    reply: jest.fn(),
    followUp: jest.fn(),
    channel: { awaitMessages },
    user: { id: 'u', username: 'Tester' },
    client
  };

  await command.button(interaction);

  expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ flags: MessageFlags.Ephemeral }));
  expect(awaitMessages).toHaveBeenCalled();
  expect(uploadScreenshot).toHaveBeenCalled();
  const fileName = uploadScreenshot.mock.calls[0][3];
  expect(fileName).toMatch(/^Alpha_Beta_\d{4}-\d{2}-\d{2}_\d{4}\.jpg$/);
  expect(HuntSubmission.create).toHaveBeenCalledWith(expect.objectContaining({
    supersedes_submission_id: 'prev1'
  }));
  const reviewArgs = reviewCh.send.mock.calls[0][0];
  expect(reviewArgs.content).toContain('Alpha Beta');
  expect(reviewArgs.content).toContain('[View screenshot](link)');
  expect(reviewArgs.components).toEqual(expect.any(Array));
  const activityMsg = activityCh.send.mock.calls[0][0];
  expect(activityMsg).toContain('Alpha Beta');
  expect(interaction.followUp).toHaveBeenCalledWith(expect.objectContaining({ content: '✅ Submission received.' }));
  expect(message.delete).toHaveBeenCalled();
});

test('submit button handles timeout', async () => {
  const awaitMessages = jest.fn().mockRejectedValue('time');
  const interaction = {
    customId: 'hunt_poi_submit::1::0',
    reply: jest.fn(),
    followUp: jest.fn(),
    channel: { awaitMessages },
    user: { id: 'u' },
    client: {}
  };

  await command.button(interaction);

  expect(interaction.reply).toHaveBeenCalled();
  expect(interaction.followUp).toHaveBeenCalledWith(expect.objectContaining({
    content: '❌ Timed out waiting for file upload.'
  }));
  expect(HuntSubmission.create).not.toHaveBeenCalled();
});

test('submit button deletes message when upload fails', async () => {
  getActiveHunt.mockResolvedValue({ id: 'h1' });
  Config.findOne
    .mockResolvedValueOnce({ value: 'a' })
    .mockResolvedValueOnce({ value: 'r' });
  uploadScreenshot.mockRejectedValueOnce(new Error('fail'));
  HuntPoi.findByPk = jest.fn().mockResolvedValue({ name: 'Alpha Beta' });
  fetch.mockResolvedValue({ ok: true, buffer: async () => Buffer.from('img'), headers: { get: () => 'image/png' } });
  const message = {
    attachments: new Collection([['1', { url: 'http://img', contentType: 'image/png' }]]),
    author: { id: 'u' },
    delete: jest.fn()
  };
  const awaitMessages = jest.fn().mockResolvedValue(new Collection([['1', message]]));
  process.env.GOOGLE_DRIVE_HUNT_FOLDER = 'root';
  const client = { channels: { fetch: jest.fn() } };
  const interaction = {
    customId: 'hunt_poi_submit::1::0',
    reply: jest.fn(),
    followUp: jest.fn(),
    channel: { awaitMessages },
    user: { id: 'u', username: 'Tester' },
    client
  };

  await command.button(interaction);

  expect(uploadScreenshot).toHaveBeenCalled();
  expect(interaction.followUp).toHaveBeenCalledWith(expect.objectContaining({ content: '❌ Failed to submit proof.' }));
  expect(message.delete).toHaveBeenCalled();
});

test('submit button with no existing submission sets supersedes to null', async () => {
  getActiveHunt.mockResolvedValue({ id: 'h1' });
  Config.findOne
    .mockResolvedValueOnce({ value: 'a' })
    .mockResolvedValueOnce({ value: 'r' });
  HuntSubmission.create.mockResolvedValue({ id: 's1', update: jest.fn(), image_url: 'link' });
  HuntSubmission.findOne.mockResolvedValue(null);
  HuntPoi.findByPk = jest.fn().mockResolvedValue({ name: 'Alpha Beta' });
  const activityCh = { send: jest.fn() };
  const reviewCh = { send: jest.fn().mockResolvedValue({ id: 'm' }) };
  const client = { channels: { fetch: jest.fn(id => (id === 'a' ? activityCh : reviewCh)) } };
  fetch.mockResolvedValue({ ok: true, buffer: async () => Buffer.from('img'), headers: { get: () => 'image/png' } });
  const message = {
    attachments: new Collection([['1', { url: 'http://img', contentType: 'image/png' }]]),
    author: { id: 'u' },
    delete: jest.fn()
  };
  const awaitMessages = jest.fn().mockResolvedValue(new Collection([['1', message]]));
  process.env.GOOGLE_DRIVE_HUNT_FOLDER = 'root';
  const interaction = {
    customId: 'hunt_poi_submit::1::0',
    reply: jest.fn(),
    followUp: jest.fn(),
    channel: { awaitMessages },
    user: { id: 'u', username: 'Tester' },
    client
  };

  await command.button(interaction);

  expect(HuntSubmission.create).toHaveBeenCalledWith(expect.objectContaining({
    supersedes_submission_id: null
  }));
  expect(message.delete).toHaveBeenCalled();
});

test('approve button updates submission', async () => {
  const update = jest.fn();
  HuntSubmission.findByPk = jest.fn().mockResolvedValue({ update, review_channel_id: 'r', review_message_id: 'm' });
  const msg = { edit: jest.fn(), content: 'x' };
  const ch = { messages: { fetch: jest.fn(() => Promise.resolve(msg)) } };
  const interaction = {
    customId: 'hunt_poi_approve::s1',
    deferUpdate: jest.fn(() => Promise.resolve()),
    client: { channels: { fetch: jest.fn(() => Promise.resolve(ch)) } },
    user: { id: 'u' }
  };

  await command.button(interaction);

  expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));
  expect(ch.messages.fetch).toHaveBeenCalledWith('m');
  expect(msg.edit).toHaveBeenCalled();
});

test('reject button shows modal', async () => {
  const interaction = { customId: 'hunt_poi_reject::s1', showModal: jest.fn() };
  await command.button(interaction);
  expect(interaction.showModal).toHaveBeenCalled();
});

test('reject modal updates submission', async () => {
  const update = jest.fn();
  HuntSubmission.findByPk = jest.fn().mockResolvedValue({
    update,
    review_channel_id: 'r',
    review_message_id: 'm'
  });
  const msg = { edit: jest.fn(), content: 'x' };
  const ch = { messages: { fetch: jest.fn(() => Promise.resolve(msg)) } };
  const fields = { getTextInputValue: jest.fn(() => 'bad') };
  const interaction = {
    customId: 'hunt_poi_reject_form::s1',
    fields,
    user: { id: 'u' },
    client: { channels: { fetch: jest.fn(() => Promise.resolve(ch)) } },
    reply: jest.fn()
  };

  await command.modal(interaction);

  expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'rejected', review_comment: 'bad' }));
  expect(ch.messages.fetch).toHaveBeenCalledWith('m');
  expect(msg.edit).toHaveBeenCalled();
  expect(interaction.reply).toHaveBeenCalled();
});

