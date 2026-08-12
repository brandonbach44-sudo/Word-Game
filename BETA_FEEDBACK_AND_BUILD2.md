# Word Fury — Beta Feedback & Build 2 Tracker

> Keep this file updated as testers report issues. When ready for Build 2, use this as the dev checklist.

---

## Bug Fixes
- [ ] **Wordsmith — Stats missing for Daily Challenge mode**
  - Stats panel shows Standard and Blitz only
  - Daily Challenge needs its own stat section (streak, win %, guess distribution)
  - Source: Brandon (TestFlight build 1)

## UI / UX
- [ ] *(add items here)*

## Crashes
- [ ] *(add items here)*

## Feature Requests
- [ ] *(add items here)*

---

## Security Notes
- **Local stat tampering**: Low risk until leaderboards added. Consider checksumming saved stats.
- **Daily challenge answer**: Computed client-side, reversible by motivated users. Consider serving from API later.
- **Word list exposure**: Bundled in app, extractable from .ipa. Acceptable for now.
- **No server validation**: Low risk until leaderboards/competitive features added.
- **No auth**: Fine for casual game. Consider anon sessions if social features added.

## Build 2 Checklist
- [ ] Fix Wordsmith Daily Challenge stats
- [ ] Review all tester feedback
- [ ] Run `npx expo-doctor@latest`
- [ ] Bump version to 1.0.1
- [ ] `eas build --platform ios --profile production`
- [ ] `eas submit --platform ios --latest`

## Timeline
| Milestone | Date |
|---|---|
| Build 1 TestFlight | August 12, 2026 |
| External Beta Review submitted | August 12, 2026 |
| Build 2 target | TBD |
| App Store release | TBD |
