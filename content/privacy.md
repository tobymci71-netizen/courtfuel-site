# Privacy Policy

**Last updated: 27 July 2026**

CourtFuel ("we", "us", "our") is a basketball-specific nutrition and training app. This Privacy Policy explains what data CourtFuel collects, where it goes, how long it is kept, and the choices you have.

## Information we collect

**Information you provide:**

- **Player profile**: your name, age, gender, height, weight, basketball position, level, and goal — entered during onboarding to personalise your nutrition analysis.
- **Meal scans**: photos you choose to scan within the app, along with the AI-generated nutrition analysis of those photos.
- **Hydration logs**: water intake you record manually.
- **Scheduled events**: practices, games, and other events you add to your schedule.
- **Game statistics**: box scores you choose to log — points, rebounds, assists, shooting splits and opponent.
- **Fuel plan preferences**: dietary requirements, budget, supermarket choices, food preferences (used to generate weekly meal plans for Pro subscribers). Some dietary options carry more than a food preference: "nut allergy", "gluten free" and "dairy free" are health information, and "halal" and "kosher" indicate a religious belief. We ask for these only to build a meal plan you can actually eat, and we never use them for anything else. Disclosing any of them is your choice: selecting "No restrictions" is always available and gives you a full meal plan without telling us anything about your health or beliefs.
- **Apple ID identifier**: when you sign in with Apple, we receive a unique identifier that lets you sign back in across sessions. We do not receive your real Apple ID email unless you choose to share it.

**Information collected automatically:**

- **Country**, derived from your device's region setting. Used only to place you in the correct leaderboard pool if you join it. We do **not** use location services and do not know where you are beyond your country.
- We do **not** collect advertising IDs.
- We do **not** use third-party analytics or advertising trackers.
- We do **not** collect crash reports automatically.

## How we use your information

- **To personalise nutrition analysis** — your player profile is sent, with each meal photo, to our server, which forwards it to our AI provider (Anthropic) to generate basketball-specific scoring.
- **To generate weekly meal and training plans** — your fuel preferences and player profile are sent the same way.
- **To back up your data** — so you do not lose your history when you change phone or reinstall. See "Where your data is stored".
- **To rank you on the leaderboard** — only if you choose to join it. See "Leaderboard".
- **To manage your subscription** — via RevenueCat and Apple.

We do not sell your data, share it with advertisers, or use it for marketing.

## Where your data is stored

Your data is stored in two places: on your device, and on our servers.

**On your device.** Your player profile, scans, hydration logs, schedule, games and meal plans are stored locally using Apple's SwiftData framework. Your sign-in tokens are stored in the iOS Keychain, encrypted by iOS.

**Backup on our servers.** So that you can restore your history on a new phone, CourtFuel uploads a copy of your data to our database, hosted by Supabase in the United Kingdom. This copy includes your player profile, your scan history (scores, calories, macros and coaching notes), hydration logs, schedule and logged games.

**Your meal photos are not included in that backup.** They remain on your device and are sent to our server only at the moment of analysis. If you restore on a new phone you will get every score and nutrition breakdown back, but not the photographs.

Your backup is readable only by you. It is protected by database access rules that check your signed-in identity on every read and write.

## Leaderboard

The leaderboard is **opt-in**. You are asked before anything is published, and nothing is sent unless you agree.

If you join, we publish only: your country, your playing position, your points-per-game average, and how many games you have logged. **Your name is never published**, nor is any photo, and no other user can see who an entry belongs to. Other players' entries are counted to work out your rank; you are never shown their identities, because we do not store them.

You can leave at any time from Profile → Leaderboard. Leaving deletes your entry, it does not merely stop updating it.

## Third-party services

- **Anthropic (Claude API)** — receives meal photos and your player profile at the moment of analysis, to generate scores and plans. [Anthropic Privacy Policy](https://www.anthropic.com/privacy)
- **Supabase** — hosts our database, holding your backup, your leaderboard entry if you joined, and your authentication session. [Supabase Privacy Policy](https://supabase.com/privacy)
- **RevenueCat** — manages your subscription. Receives your Sign in with Apple identifier and your purchase history. [RevenueCat Privacy Policy](https://www.revenuecat.com/privacy)
- **Apple** — Sign in with Apple for authentication, and the App Store for payment processing. Governed by Apple's terms.

## Data retention and deletion

- Your backup is retained while your account exists, and is overwritten each time the app backs up.
- **Deleting your account deletes your server-side data**, not just the copy on your phone. Profile → Delete account removes your player card, scans, hydration logs, schedule, games, your backup, and your leaderboard entry.
- Uninstalling the app removes the copy on your device. It does **not** delete your backup — use Delete account for that.
- To revoke Sign in with Apple access, visit Settings → Apple ID → Apps Using Apple ID on your device.

## Your rights

Depending on where you live, you may have the right to access, correct, export or delete your personal data, and to object to or restrict its processing.

- **Access** — your data is visible within the app at any time.
- **Deletion** — Profile → Delete account removes it everywhere.
- **Anything else** — email us at the address below and we will respond.

## Children's privacy

CourtFuel is intended for users aged 13 and over. If you are under 13, please do not use the app, and we will delete any data we learn belongs to a user under 13.

CourtFuel is used by school-age and youth players. We keep what we collect from them to the minimum the app needs, we never publish a name alongside a leaderboard entry, and the leaderboard is off unless it is switched on.

If you are a parent or guardian and want your child's data removed, email us and we will do it.

## Changes to this policy

We may update this Privacy Policy as the app evolves. Material changes will be communicated within the app before they take effect.

## Contact

Questions about privacy, or a data request: **contact@courtfuel.app**
