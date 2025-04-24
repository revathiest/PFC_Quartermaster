// __mocks__/config/database.js

const { jest } = require('@jest/globals');

const VerificationCode = {
  upsert: jest.fn(),
  findOne: jest.fn()
};

const VerifiedUser = {
  findOne: jest.fn(),
  upsert: jest.fn()
};

const OrgTag = {
  findByPk: jest.fn()
};

module.exports = {
  VerificationCode,
  VerifiedUser,
  OrgTag
};
