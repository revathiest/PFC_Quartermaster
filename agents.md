# AGENTS.md

This file defines contributor and AI agent guidelines for working in the `PFC_Quartermaster` repository. These standards are mandatory for all code contributions, automation scripts, and test coverage tasks.

---

## ⚙️ Repo Standards

### Language & Design

* Use JavaScript (Node.js) with CommonJS or ESM where appropriate.
* Follow modular design — one logical responsibility per file.
* Avoid raw SQL; use Sequelize ORM for all database operations.
* Discord integrations must use the Slash Command Interaction API.

### Command Structure

* All commands reside in the `commands/` directory.
* Categories (e.g. `admin`, `user`, `tools`) are organisational only.
* Each `.js` file defines a full slash command.
* For grouped subcommands (e.g. `/ambient set`, `/ambient stop`), place logic in `commands/<category>/ambient/*.js` and register the full command in `commands/<category>/ambient.js` using `.addSubcommand(...)`.

**Structure Example:**

```
commands/
├── user/
│   ├── verify.js           => /verify
│   └── whois.js            => /whois
├── fun/
│   ├── ambient.js          => /ambient (aggregates subcommands)
│   └── ambient/
│       ├── set.js          => defines `set` subcommand logic
│       └── stop.js         => defines `stop` subcommand logic
```

Each command file must export:

```js
module.exports = {
  data: new SlashCommandBuilder()
    .setName('commandName')
    .setDescription('Command description'),
  async execute(interaction) {
    // Command logic
  },
};
```

---

## ✅ Pull Request Checklist

* [ ] The latest changes from `origin/development` or `origin/master` have been merged into this branch and all conflicts resolved prior to opening the pull request.
* [ ] Unit tests cover all new logic.
* [ ] Unit tests include negative paths and edge cases.
* [ ] Argument validation is asserted in mocks.
* [ ] All tests pass using `npm test`.
* [ ] `CHANGELOG.md` updated unless change is trivial/internal-only.
* [ ] Branch name uses appropriate prefix: `feat/`, `fix/`, `test/`, etc.
* [ ] Commit messages are concise, descriptive, and reference issues.
* [ ] Code is modular, documented, and free from console logging.
* [ ] Mocks cleaned with `beforeEach`/`afterEach`.

---

## 📁 Test Coverage Requirements

### Unit Testing

* All modules must include tests that:

  * Cover success and failure paths.
  * Assert the shape and content of mocked DB interactions using `.toHaveBeenCalledWith(expect.objectContaining(...))`.
  * Validate fallback behaviour when external services or data sources fail.

### Codex Agent Tasking

* Traverse all files in `__tests__/` and `*.test.js`.
* Identify:

  * Shallow tests (e.g. `toHaveBeenCalled()` without checking inputs).
  * Untested error cases.
  * Mocked operations that are never asserted.
* Refactor by:

  * Deepening all assertions.
  * Adding error simulations using `mockRejectedValueOnce()`.
  * Testing conditional branches, invalid input, and malformed data.
  * Removing dead or duplicate test cases.

---

## 🚫 Prohibited Patterns

* Tests that pass without verifying logical behaviour.
* Mock functions that always return `true` without validation.
* Duplicate tests for identical logic paths.
* Any raw SQL.
* Unscoped or excessive logging.

---

## 🪥 Code Hygiene

* Format consistently with project linting rules.
* Avoid unnecessary complexity.
* Use dependency injection for testability.
* Ensure clear separation between Discord I/O, DB logic, and pure utilities.

---

This document defines canonical guidelines for all contributors and AI agents participating in the development of this project. No shortcuts. No exceptions.
