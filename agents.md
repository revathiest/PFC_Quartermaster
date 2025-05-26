# AGENTS.md

This file defines contributor and AI agent guidelines for working in the `PFC_Quartermaster` repository. All instructions must be followed when auditing, refactoring, or adding features.

---

## ⚙️ Repo Standards

### Language & Style

* JavaScript (Node.js), using CommonJS or ESM as needed.
* Modular design: one logical concern per file.
* Sequelize ORM for all DB interaction — no raw SQL.
* Discord bots use slash commands via the Interaction API.

### Testing Framework

* Use `Jest` with high-fidelity mocks.
* Avoid shallow tests (`jest.fn(() => true)`) unless they’re specifically validated.
* Test both happy and failure paths for all business logic.

---

## ✅ Pull Request Checklist

* [ ] Unit tests included for all new logic.
* [ ] Edge cases and failure branches covered.
* [ ] `npm test` passes.
* [ ] `CHANGELOG.md` updated if needed.
* [ ] Branch naming: `feat/`, `fix/`, or `test/` prefixes.
* [ ] Concise, informative commit messages.

---

## 📁 Directory Guidelines

### Commands

* All Discord slash commands live in the `commands/` directory.
* Subdirectories (e.g. `admin/`, `user/`, `tools/`) are for **organisational purposes only** — they do not define command namespaces.
* The **actual slash command name** is defined by the `.setName()` call in each command file.
* If you want a command like `/user verify`, you must implement it using `.addSubcommand(...)` inside a shared file (not separate files).
* Subdirectories inside categories (e.g. `fun/ambient/`) can be used to group subcommand files **for maintainability**, but these files must still be composed into a single `SlashCommandBuilder` if the goal is a compound command.

**Examples:**

```
commands/
├── admin/
│   ├── addaccolade.js      => registers /addaccolade
│   └── listtags.js         => registers /listtags
├── user/
│   ├── verify.js           => registers /verify
│   └── whois.js            => registers /whois
├── fun/
│   ├── ambient.js          => registers /ambient with subcommands
│   └── ambient/
│       ├── set.js          // defines subcommand logic for 'set'
│       └── stop.js         // defines subcommand logic for 'stop'
```

In the above, if `fun/ambient/` contains files like `set.js` and `stop.js`, you must also define `ambient.js` in `fun/` to register `/ambient` and compose the subcommands using `.addSubcommand(...)`.

### Command Definition Format

Each file should export an object with:

* `data`: a `SlashCommandBuilder` instance defining the command.
* `execute(interaction)`: the function to run when the command is triggered.

```js
module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Link your RSI account.'),
  async execute(interaction) {
    // Command logic here
  }
};
```

---

## 🧪 Automated Test Coverage Improvement (Codex Agents)

### 🎯 Task: Audit & Improve All Tests

Codex agents must:

1. Traverse all files in `__tests__/` and `*.test.js`.
2. Identify shallow tests:

   * `.toHaveBeenCalled()` with no `.toHaveBeenCalledWith(...)`.
   * Mocks not verified via assertions.
   * Lack of failure path testing.
3. Refactor:

   * Add full argument checks.
   * Add error simulation (`mockRejectedValueOnce`).
   * Add missing branch condition tests.
   * Rename unclear test descriptions.
   * Use `describe()` blocks to organise related cases.

---

## 🚫 Anti-Patterns

* Empty or ambiguous test cases.
* Overuse of `true` mocks without validation.
* Copy/paste tests for similar commands with no variation in logic tested.
* Tests that merely run code, not validate it.

---

## 🪥 Code Hygiene

* Format all files using a consistent style.
* Do not log to console in tests — assert instead.
* Clean up mocks in `beforeEach()` and `afterEach()` where needed.

---

This file defines canonical behaviour for developers and AI contributors working on this project.
