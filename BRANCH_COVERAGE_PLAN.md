# Branch Coverage Improvement Plan

This document lists all modules currently below **80% branch coverage** based on the latest `npm test --coverage` run. For each file, potential reasons for the missing branches are outlined along with suggestions for additional tests or refactoring needed to raise coverage.

## botactions
- **botactions/scheduledEventsHandler.js** – 66.66% branches
  - Catch paths for database operations and `getAllScheduledEventsFromClient` are never triggered.
  - Add tests that mock `Event.create`, `Event.update`, and `Event.destroy` to reject so the error branches execute.
  - Simulate failures in `guild.scheduledEvents.fetch()` to cover the `catch` inside `getAllScheduledEventsFromClient`.

- **botactions/utilityFunctions.js** – 0% branches
  - No tests exist for helper functions.
  - Create a new test suite covering `formatTime`, `formatDuration`, and the three lookup helpers including error paths when `.fetch()` rejects or returns `null`.

- **botactions/eventHandling/voiceEvents.js** – 77.77% branches
  - Current tests miss the branch when `VoiceLog.findOne` returns `null` for leave/move events and the fallback when channel/user lookup fails.
  - Add cases where `getChannelNameById` or `getUserNameById` reject and where no previous join log exists.

- **botactions/maintenance/logCleanup.js** – 66.66% branches
  - Only happy path and `fs.readdir` error are tested. Branches for `fs.stat` failures and `fs.unlink` errors remain uncovered.
  - Mock `fs.stat` and `fs.unlink` to throw and assert logged warnings/errors.

- **botactions/orgTagSync/syncCooldownTracker.js** – 50% branches
  - `canRunManualSync` has two code paths but coverage reports only one executed.
  - Ensure each test resets `lastManualSyncTime` and checks both first-run and cooldown-expired branches; consider adding a case for exactly equal to the cooldown window.

- **botactions/orgTagSync/syncOrgTags.js** – 77.27% branches
  - Branches for unmanageable members and for missing/unknown org tags are not covered.
  - Add tests where `member.manageable` is false and where `OrgTag.findByPk` returns `null` but the DB update still occurs.

## commands
- **commands/admin/addaccolade.js** – 70.58% branches
  - Lacks coverage for the branch when the role already exists, and for invalid Wall of Fame channel cases.
  - Add tests mocking `Accolade.findOne` to return a record, and when `channel.type` is invalid.

- **commands/tools/trade/commodities.js** – 50% branches
  - Button handler early-return branch when the customId does not match is untested.
  - Add a test ensuring `handleTradeCommodities` is not called for unrelated button IDs.

## jobs
- **jobs/scheduler.js** – 25% branches
  - Only the success path of `runFullApiSync` is tested. Failure branch inside `runAndRepeat` is uncovered.
  - Add test where `runFullApiSync` rejects to verify error logging, and test scheduling when the next run is scheduled for the following day.

## utils
- **utils/commandRegistration.js** – 65% branches
  - Early return when a directory has a paired parent file and the catch block for invalid command modules are not fully exercised.
  - Add tests creating a folder with a sibling `.js` file to trigger the skip, and a case where `require` throws to hit the catch path.

- **utils/fetchSCData.js** – 77.77% branches
  - Multi-page loop and the catch block for JSON parse errors are not covered.
  - Mock multiple paged responses using `links.next` and simulate `response.json()` throwing to exercise the error branch.

- **utils/formatVerifiedNickname.js** – 72.22% branches
  - No tests check the `displayName` empty path or verify truncation with tags when unverified.
  - Add cases with an empty name and with a very long tagged name to trigger truncation logic.

- **utils/parseDice.js** – 68.75% branches
  - Missing coverage for keep-high/keep-low options and modifiers.
  - Expand tests to parse strings like `4d6kh3+2` and verify the kept rolls and modifier application.

- **utils/voiceActivityReport.js** – 66.66% branches
  - Only a basic scenario is tested. Branches handling no events or ongoing users at report time are not executed.
  - Add tests with empty datasets and with active users remaining at the end of the timeframe.

### API Sync modules
The following all share a similar pattern: successful upsert path tested but branches for skipping invalid entries and error handling are not.
- **utils/apiSync/galactapediaDetail.js** – 62.5% branches
- **utils/apiSync/manufacturers.js** – 66.66% branches
- **utils/apiSync/syncApiData.js** – 21.05% branches
- **utils/apiSync/syncUexCategories.js** – 75% branches
- **utils/apiSync/syncUexCommodityPrices.js** – 50% branches
- **utils/apiSync/syncUexFuelPrices.js** – 75% branches
- **utils/apiSync/syncUexItemPrices.js** – 50% branches
- **utils/apiSync/syncUexPoi.js** – 75% branches
- **utils/apiSync/syncUexTerminals.js** – 75% branches
- **utils/apiSync/syncUexVehiclePurchasePrices.js** – 75% branches
- **utils/apiSync/syncUexVehicleRentalPrices.js** – 75% branches
- **utils/apiSync/syncUexVehicles.js** – 75% branches
- **utils/apiSync/vehicles.js** – 66.66% branches
  - For each, add tests that supply records with missing required fields to trigger `skipped` branches and simulate failures from `fetchUexData` or database methods to hit catch blocks.
  - `syncApiData.js` needs interaction-based tests exercising `updateStep` error handling and embed updates.

### Trade utilities
- **utils/trade/tradeCalculations.js** – 60.6% branches
  - Many `continue` paths are untested (invalid prices, zero cargo, availableCash null, etc.).
  - Add tests for each early-continue condition and for the catch block by mocking internal functions to throw.

- **utils/trade/tradeComponents.js** – 63.15% branches
  - Branch for empty vehicle list is covered but custom `customIdPrefix` variations are not.
  - Add a test supplying a custom prefix and verify the menu ID.

- **utils/trade/tradeEmbeds.js** – 55.67% branches
  - Error handling blocks and edge cases (null fields, unknown locations) are not covered.
  - Create tests that pass malformed input and assert the returned embed has the failure title.

- **utils/trade/tradeQueries.js** – 47.36% branches
  - Many catch blocks are untested. Add cases where database queries reject to hit these paths.
  - Also cover the filtering logic in `getReturnOptions` by providing mixed terminal data.

### Trade handlers
- **utils/trade/handlers/best.js** – 75.67% branches
  - Branch when `userId` is missing (should return error when multiple ships match) and when `calculateProfitOptions` throws are not tested.

- **utils/trade/handlers/bestCircuit.js** – 0% branches
  - No tests exist for this handler. Implement tests covering normal embed generation and failure paths.

- **utils/trade/handlers/commodities.js**, **find.js**, **locations.js**, **price.js**, **route.js**, **ship.js** – branch coverage ranges from 50–64%
  - Add tests for early-return conditions, pagination branches, and error handling where applicable.

By writing targeted unit tests for these branches (and mocking failures where necessary) overall branch coverage can be increased significantly without altering production logic.
