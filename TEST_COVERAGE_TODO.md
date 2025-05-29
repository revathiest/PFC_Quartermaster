# Test Coverage Improvement Plan

This document summarises tasks required to raise Jest coverage to **100%** across all modules.

## Progress as of 2025-05-29
Current overall coverage around 96% line coverage. Tests now exist for ambientEngine, utilityFunctions, admin commands, process_messages, openaiHandler and many trade handlers. Remaining gaps include fun commands, several tool commands, and most models.

## 1. Create Test Modules for Untested Files
- [x] `botactions/ambient/ambientEngine.js`
- [x] `botactions/utilityFunctions.js` (helpers like `formatTime` and async fetch utilities)
- [x] Admin commands such as `addsnapchannel.js`, `lookupuser.js`, and `syncapidata.js`
- [ ] Fun commands like `coinflip.js`, `highcard.js`, and `roll.js`
- [ ] Tool commands (`help.js`, `shipdetails.js`, `uexvehicle.js`)
- [ ] All model definitions under `models/`
- [x] Additional botaction handlers (e.g. `process_messages.js`, `openaiHandler.js`)

## 2. Expand Tests for Partially Covered Modules
- Increase branch and line coverage for modules already tested but below 100% such as:
  - `botactions/scheduledEventsHandler.js` and `botactions/eventHandling/voiceEvents.js`
  - `botactions/maintenance/logCleanup.js`
  - `botactions/orgTagSync/syncOrgTags.js` and `syncCooldownTracker.js`
  - `commands/admin/addaccolade.js`
  - `commands/user/verify.js` and `commands/user/whois.js`
  - Aggregator commands under `commands/tools/trade/`
  - Job modules like `jobs/scheduler.js`
  - Utility modules including `commandRegistration.js`, `fetchSCData.js`, and `parseDice.js`
  - API sync helpers such as `syncApiData.js`

## 3. Follow AGENTS Guidelines in Tests
- Cover success, failure, and edge cases for every exported function.
- Validate argument shapes and database interactions using `expect.objectContaining`.
- Simulate errors with `mockRejectedValueOnce` to verify error handling.
- Assert side effects such as role changes, messages sent, and DB writes.
- Remove duplicate or trivial tests and clean up mocks in `beforeEach`/`afterEach`.

## 4. Ensure Complete Model Coverage
- Write unit tests for each Sequelize model verifying fields and options. Examples include `models/galactapediaEntry.js` and `models/uexCommodityPrice.js`.

## 5. Adjust Jest Configuration If Needed
- Confirm `collectCoverageFrom` includes root files like `bot.js` so coverage metrics apply everywhere.

## 6. Monitor Coverage
- After adding and updating tests, run `npm test -- --coverage` to confirm **100%** statements, branches, functions, and lines for all files.

By completing these tasks and adhering to the repository guidelines, full test coverage can be achieved.
