# 👵📱 Grandma's Phone

**▶ Play it: https://grandma-phone-two.vercel.app**

**A scam-spotting game for social good.** Grandma Rosa's phone won't stop buzzing. Some messages are from the people she loves, and some are scams. Keep her savings safe **without cutting her off from her family**.

## How to play

1. **Read** each message on Grandma's phone: texts, chats, emails, bank alerts, phone calls and voice notes.
2. **Tap anything suspicious** to flag it 🚩. Use 🔍 to see who really sent it, or where a link really goes.
3. **Check another way** 📞 (2 per day), like calling the real person on their saved number.
4. **Decide:** ✅ *Safe* or 🚫 *Scam*.

Scams that get through cost Grandma her savings. Blocking real messages from her granddaughter, doctor or book club makes her lonely and can cost her too. At the end of the week you get a rank, your "blind spot", and a **printable cheat sheet** to share with the older people in your life.

## Why it matters

In 2025, Americans over 60 reported losing about **$7.7 billion** to fraud (FBI Internet Crime Complaint Center), and most scams are never reported. The game teaches the 10 red flags behind almost every scam:

- strange senders and lookalike links
- rush, fear and "too good to be true"
- strange payments (gift cards, fees, "approve to receive")
- requests for codes or ID
- remote-access apps
- secrecy and emotional hooks

It also covers newer tricks like **AI voice clones** and the "Hi Mum, new number" scam. The game rewards **checking another way** rather than blocking everything, because cutting older people off from family is part of what makes them vulnerable.

## Features

- 20 hand-written messages over 5 days (12 scams, 8 real), getting trickier as the week goes on
- Tap-to-flag red flags, with feedback on every flag you found or missed
- Two meters, savings and happiness, so both kinds of mistake have a cost
- Field guide always visible, and a lesson after every message
- **Accessible:** "Larger text" mode, full keyboard play (`S` safe, `B` block, `C` check, Tab/Enter to flag), screen-reader labels and announcements, reduced-motion support, no time pressure, works on phones

## Run it

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # game-logic tests (Vitest)
npm run build
```

Built with React 19, TypeScript and Vite. There's no backend, account or tracking.

## Project structure

- `src/data/messages.ts`: all game content (messages, red flags, lessons)
- `src/game.ts`: scoring and game rules (pure functions, unit-tested in `src/game.test.ts`)
- `src/App.tsx`: screens (title, day intro, phone, feedback, end report)
- `src/index.css`: styles, including mobile and print layouts
