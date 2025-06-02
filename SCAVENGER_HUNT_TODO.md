# 🗞 Scavenger Hunt TODO List
When completing items on this list, it is important to update the items to keep clear track of what is done and what is still pending.

## 🧠 Core Concepts

* Screenshot-based scavenger hunt in Star Citizen
* Users must take selfies with specific Points of Interest (POIs)
* Each scavenger hunt is a discrete event instance (but the system supports future re-use)
* Hunt status is automatically managed by linked Discord Scheduled Events
* All command responses are ephemeral except that when evidence is submitted, a non-ephemeral message is added in the hunt activity channel

## Current Status

Initial scaffolding for the scavenger hunt exists on the `scavenger` branch. The following pieces are implemented:

* `/hunt help`, `/hunt list`, and `/hunt set-channels` commands
* Sequelize models for `Hunt`, `HuntPoi`, and `HuntSubmission`

All remaining checklist items are still pending.

---

## ✅ Functional Requirements

### 📌 Event ("Hunt") Management

* [x] `/hunt schedule` — creates both a new scavenger hunt and a linked Discord Scheduled Event (name, description, start, end, channel)
* [x] `/hunt list` — list all hunts by status
* [ ] Hunt `status` auto-syncs based on linked Discord Event lifecycle:
  * scheduled → upcoming
  * active → active
  * completed → archived
* [ ] Hunt record should be updated in the database if/when the event is updated in discord

### 🗺 POI Management (shared across all hunts)

* [x] `/hunt poi create` — create a reusable POI (name, hint, location, image, points)
* [x] `/hunt poi list` — displays a paginated embed of POIs with a select menu for current page items

  * [x] Selecting an item highlights the POI and displays buttons to either ✏️ Edit or 📦 Archive
  * [x] Edit opens a modal with prefilled data (name, description, hint, location, image url, points)
  * [x] Archive immediately archives the selected POI
  * [x] Pagination updates both the embed and the select menu
  * [ ] Admin view restricts these controls to `Admiral` and `Fleet Admiral` roles
* [ ] POIs exist globally and are not tied to a specific hunt
* [ ] All POI management uses select menus and modals to avoid reliance on raw IDs

### 📤 Submission & Review

* [ ] Rejected submissions can be replaced by resubmitting, which resets their status to pending

* [ ] Submitting proof for the same POI multiple times will overwrite the user's previous submission

* [ ] `/hunt poi list` (non-mod view) — displays a paginated embed of POIs with a select menu for current page items

  * Selecting an item shows a 📸 Submit Proof button
  * Clicking submit opens a modal or image upload interaction for selfie submission
  * Pagination updates both the embed and select menu

* [ ] `/hunt my-submissions` — view own submissions for the current hunt

* [ ] Submissions are reviewed externally via Google Drive

  * Submissions start in a pending state and must be approved or rejected by moderators
  * Each submission is echoed to a designated review channel
  * Messages include user, POI, image link, and status
  * Each message includes ✅ Approve and ❌ Reject buttons
  * Rejecting a submission opens a modal requiring the moderator to enter a reason (review\_comment is mandatory)
  * Once a submission is acted on, the message is updated to reflect its status and the buttons are removed

* [ ] Submissions must include selfie image and are automatically tied to the currently active hunt

### 🏆 Scoring & Leaderboard

* [ ] POIs have point values
* [ ] Approving a submission grants the user points
* [ ] Ties are broken by the earliest final submission (earlier timestamp wins)
* [ ] `/hunt leaderboard` — shows scores for the current active or most recent hunt

  * Displays a select menu with names of previous hunts at the bottom
  * Selecting a past hunt updates the response to show its leaderboard
* [ ] `/hunt score [user]` — shows the score breakdown for yourself or another user (optional parameter)

### 🗓 Discord Integration

* [ ] Link hunt to a Discord Scheduled Event
* [ ] Bot auto-syncs hunt status from Discord Event lifecycle

### 🛡 Channel Restrictions

* [x] `/hunt help` is always allowed in any channel
* [x] `/hunt set-channels` — brings up a UI with currently configured channels (or blank), and allows setting:

  * Activity channel (where commands can be run)
  * Submission review channel (where mod actions are logged)
* [ ] Block all `/hunt` commands if used outside the designated activity channel

---

## 📦 Data Models (Sequelize-style)

* ✅ Sequelize models implemented for Hunt, HuntPoi and HuntSubmission

### Hunt

* id (UUID)
* name (string)
* description (string, optional)
* discord\_event\_id (string, optional)
* starts\_at (timestamp)
* ends\_at (timestamp)
* status (enum: upcoming, active, archived)

### POI

* id (UUID)
* name (string)
* description (string, optional)
* created\_by (Discord ID)
* updated\_by (Discord ID)
* created\_by (Discord ID)
* updated\_by (Discord ID)
* hint (string)
* location (string)
* image\_url (string)
* points (int)
* status (enum: active, archived)

### Submission

* id (UUID)
* review\_comment (string, required for rejections and stored in the submission record)
* hunt\_id (FK, resolved internally to the current active hunt)
* poi\_id (FK)
* user\_id (Discord ID)
* image\_url (string)
* status (enum: pending, approved, rejected)
* reviewer\_id (Discord ID)
* review\_message\_id (string, nullable)
* review\_channel\_id (string, nullable)
* supersedes\_submission\_id (UUID, nullable)
* submitted\_at (timestamp)
* reviewed\_at (timestamp)

---

## 🧪 Stretch Ideas

* [ ] Style points or bonus categories
* [ ] Pose detection (e.g., waving emote)
* [ ] Automatic image tagging or watermarking
* [ ] Event summary post generation
