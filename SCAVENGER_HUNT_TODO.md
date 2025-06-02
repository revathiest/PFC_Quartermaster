# 📸 NMBS Photo Scavenger Hunt – TODO List

## 📁 Database Setup

* [ ] Create `scavenger_items` table

  * id, name, description, points, enabled

* [ ] Create `user_scavenger_progress` table

  * id, userId, itemId, photoFilename, photoUrl, status (pending/approved/rejected), submittedAt, reviewedBy, reviewedAt

## 🧱 Sequelize Models

* [ ] Define `ScavengerItem` model
* [ ] Define `UserScavengerProgress` model
* [ ] Add model associations
* [ ] Write migration files

## 📜 Slash Commands – Delegates

* [ ] `/join-scavenger` – Opt into the scavenger hunt
* [ ] `/my-scavenger-list` – View assigned scavenger items
* [ ] `/submit-scavenger` – Submit photo for a specific item (only in designated channel)
* [ ] `/scavenger-progress` – View personal completion status
* [ ] `/scavenger-leaderboard` – Public ranking by item points

## 🔧 Slash Commands – Staff/Admin

* [ ] `/scavenger-init-drive` – Create and register Google Drive folder
* [ ] `/scavenger-reviewlog` – View recent submission history (read-only)
* [ ] `/scavenger-add` – Add a new scavenger item
* [ ] `/scavenger-edit` – Modify existing item details
* [ ] `/scavenger-disable` – Disable an item temporarily
* [ ] `/scavenger-list` – View all scavenger items
* [ ] `/scavenger-reset @user` – Reset user’s progress
* [ ] `/scavenger-channel` – Set the designated scavenger channel

## ✅ Submission Flow & Verification

* [ ] Restrict commands to designated scavenger channel
* [ ] Validate and upload image to Google Drive
* [ ] Rename file using `[discordUsername]_[itemName]_[timestamp].jpg`
* [ ] Store photoFilename and photoUrl in DB
* [ ] Post submission in staff review channel with approve/reject buttons
* [ ] On button click, update DB status and delete review message

## 🎮 Gamification

* [ ] Assign points per item
* [ ] Tally approved item points per user
* [ ] Build scavenger leaderboard
* [ ] Optional bonus for full completion

## 🛡️ Safeguards & Controls

* [ ] Enforce one submission per item per user
* [ ] Prevent participation without `/join-scavenger`
* [ ] Image type and file size checks
* [ ] Staff override/reset capability

## 🧠 Future Enhancements

* [ ] Team scavenger mode
* [ ] Time-limited items
* [ ] Thematic categories (e.g., landmarks, staff, events)
* [ ] Auto-approved easy items
* [ ] Public gallery view of submissions (staff moderated)

---

All cleaned up and review-ready. Let me know when to start scaffolding!
