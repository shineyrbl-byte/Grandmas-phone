export type FlagId =
  | "sender"
  | "link"
  | "urgency"
  | "fear"
  | "tooGood"
  | "payment"
  | "personalInfo"
  | "remote"
  | "secrecy"
  | "emotional";

export const FLAGS: Record<FlagId, { icon: string; name: string; tip: string }> = {
  sender: { icon: "🕵️", name: "Strange sender", tip: "Unknown number, new contact, or an address that only looks like the real one." },
  link: { icon: "🔗", name: "Suspicious link", tip: "The link goes to a lookalike website, not the company's real one." },
  urgency: { icon: "⏰", name: "Rush & pressure", tip: "\"Right now\", \"within 24 hours\", \"don't hang up\". Scammers don't want you to stop and think." },
  fear: { icon: "😱", name: "Scary threat", tip: "Arrest, hackers, a stolen account. Fear makes people act before they check." },
  tooGood: { icon: "🎁", name: "Too good to be true", tip: "Prizes you never entered, free gifts, surprise refunds." },
  payment: { icon: "💳", name: "Strange payment", tip: "Gift cards, upfront fees, cash couriers, or \"approve to receive\"." },
  personalInfo: { icon: "🔑", name: "Asks for codes or ID", tip: "One-time codes, PINs, ID numbers. Nobody real asks you to read these out." },
  remote: { icon: "🖥️", name: "Wants control of a device", tip: "\"Install this app so I can fix it\" gives a stranger your screen and bank." },
  secrecy: { icon: "🤫", name: "Secrecy or avoids calls", tip: "\"Don't tell your family\", \"I can't talk right now\". Scams hide from people who'd spot them." },
  emotional: { icon: "💘", name: "Emotional hook", tip: "Flattery, romance or a sad story to make you want to help." },
};

export type Kind = "sms" | "chat" | "email" | "call" | "voice" | "bank" | "pay";

export const KIND_LABEL: Record<Kind, { icon: string; app: string }> = {
  sms: { icon: "💬", app: "Messages" },
  chat: { icon: "🟢", app: "Chat" },
  email: { icon: "✉️", app: "Mail" },
  call: { icon: "📞", app: "Phone call" },
  voice: { icon: "🎙️", app: "Voice note" },
  bank: { icon: "🏦", app: "Bank app" },
  pay: { icon: "💸", app: "PayQuick" },
};

export interface Segment {
  t: string;
  flag?: FlagId;
}

export interface Message {
  id: string;
  day: number; // 0 = Monday
  kind: Kind;
  sender: { name: string; detail: string; flag?: boolean };
  segments: Segment[];
  link?: { label: string; real: string; flag?: boolean };
  scam: boolean;
  /** Money Grandma loses if a scam gets through, or if a real fraud alert is ignored. */
  risk: number;
  grandma: string;
  verify?: { action: string; result: string };
  /** What happens if Grandma goes ahead (replies, pays, etc.). */
  ifAllowed: string;
  /** What happens if you block it. */
  ifBlocked: string;
  lesson: string;
}

export const DAYS = [
  { name: "Monday", intro: "Morning, dear! My phone has been buzzing since breakfast. Can you take a look?" },
  { name: "Tuesday", intro: "Leo set up my new laptop yesterday. Now everyone wants to talk to me!" },
  { name: "Wednesday", intro: "Book club today! Let's get through my messages first." },
  { name: "Thursday", intro: "Knee appointment this morning. Keep an eye on my phone for me?" },
  { name: "Friday", intro: "Last day of the week. I feel like they're getting trickier…" },
];

export const START_SAVINGS = 15000;

export const MESSAGES: Message[] = [
  // ───────── Monday ─────────
  {
    id: "lottery",
    day: 0,
    kind: "sms",
    sender: { name: "+1 (876) 555-0142", detail: "Not in Grandma's contacts. Area code 876 is Jamaica, a common source of lottery scams.", flag: true },
    segments: [
      { t: "CONGRATULATIONS!! You have WON $50,000 in the National Senior Lottery! ", flag: "tooGood" },
      { t: "To claim your prize, pay a $199 processing fee ", flag: "payment" },
      { t: "within 24 HOURS or your prize is cancelled.", flag: "urgency" },
    ],
    link: { label: "bit.ly/claim-prize-now", real: "Short link that really goes to claims-senior-lottery.xyz/pay", flag: true },
    scam: true,
    risk: 600,
    grandma: "I never bought a lottery ticket… but $50,000! I could fix the roof!",
    ifAllowed: "Grandma paid the $199 fee, then $400 more in \"taxes\". There was never any prize.",
    ifBlocked: "Blocked and reported. Grandma's roof money stays in the bank.",
    lesson: "You can't win a lottery you never entered, and real prizes never charge a fee to collect.",
  },
  {
    id: "priya-lunch",
    day: 0,
    kind: "chat",
    sender: { name: "Priya 🌻 (granddaughter)", detail: "Saved in Grandma's contacts since 2019. Same number as always." },
    segments: [
      { t: "Hi Gran! Mum says Sunday lunch is at 1pm at our place. " },
      { t: "Can you bring your famous lemon cake? 🍋 " },
      { t: "Love you ❤️" },
    ],
    scam: false,
    risk: 0,
    grandma: "Oh, Sunday lunch! I'd better buy lemons.",
    verify: { action: "Call Priya's saved number", result: "Priya picks up: \"Yes Gran, 1pm! Don't forget the cake!\"" },
    ifAllowed: "Grandma replies with ten emojis. Sunday lunch is on! 🍋",
    ifBlocked: "Grandma never saw the message and missed Sunday lunch. Priya was worried sick.",
    lesson: "Saved contact, same number, no money, no codes, no rush. Not every message is a scam, and cutting Grandma off from family hurts too.",
  },
  {
    id: "clinic",
    day: 0,
    kind: "sms",
    sender: { name: "CityHealth Clinic", detail: "Sent from 55012, the clinic's official text number, the same one printed on Grandma's appointment card." },
    segments: [
      { t: "Reminder: Rosa, your appointment with Dr. Okafor is Thu at 10:30 AM. " },
      { t: "Reply C to confirm, or call the clinic at 555-0100 to reschedule. " },
      { t: "We will never ask for payment by text." },
    ],
    scam: false,
    risk: 0,
    grandma: "Ah yes, my knee check-up. I'd completely forgotten!",
    verify: { action: "Check Grandma's appointment card", result: "The card says Thursday 10:30 AM with Dr. Okafor. It matches." },
    ifAllowed: "Grandma confirms and makes it to her knee check-up on Thursday. 🦵",
    ifBlocked: "Grandma missed her appointment. The next opening is in 3 months.",
    lesson: "It knows her real appointment, asks for nothing, and gives the clinic's known number.",
  },
  {
    id: "amazon",
    day: 0,
    kind: "email",
    sender: { name: "Amazon Support", detail: "Real address: support@amaz0n-orders.co. That's a zero instead of an \"o\", and it isn't amazon.com.", flag: true },
    segments: [
      { t: "Your order #44-1928 for an iPhone 16 Pro ($1,299.00) has shipped. ", flag: "fear" },
      { t: "If you did not make this purchase, " },
      { t: "CALL our refund team IMMEDIATELY at 1-888-555-0199 ", flag: "urgency" },
      { t: "so we can secure your account." },
    ],
    scam: true,
    risk: 2000,
    grandma: "An iPhone? I didn't order that! I'd better call them right away…",
    verify: { action: "Open the real Amazon app", result: "Grandma's real order history has no iPhone. The email is fake." },
    ifAllowed: "The \"refund team\" got Grandma to install an app, faked a refund, and took $2,000 in gift cards.",
    ifBlocked: "Blocked. Grandma checks her real Amazon app: no iPhone order.",
    lesson: "Fake order emails scare you into calling the scammer. Check orders in the real app, never with the number in the email.",
  },

  // ───────── Tuesday ─────────
  {
    id: "usps",
    day: 1,
    kind: "sms",
    sender: { name: "USPS", detail: "Sent from +63 917 555 0148, a mobile number in the Philippines. The real USPS texts from short code 28777.", flag: true },
    segments: [
      { t: "USPS: Your package could not be delivered due to an incomplete address. " },
      { t: "Update within 12 hours or it will be returned to sender.", flag: "urgency" },
    ],
    link: { label: "usps-redelivery-help.com", real: "usps-redelivery-help.com, registered 3 days ago. The real site is usps.com.", flag: true },
    scam: true,
    risk: 350,
    grandma: "A package? I'm not expecting anything… maybe it's a gift?",
    verify: { action: "Type usps.com into the browser yourself", result: "There's no package waiting for Grandma at USPS." },
    ifAllowed: "The \"redelivery fee\" page stole Grandma's card details. $350 of strange charges appeared.",
    ifBlocked: "Blocked and reported as junk. No package was ever coming.",
    lesson: "Fake delivery texts are one of the most common scams. Use the real website and the tracking number from your own order.",
  },
  {
    id: "microsoft",
    day: 1,
    kind: "call",
    sender: { name: "Caller ID: \"Microsoft Tech Dept\"", detail: "Anyone can fake caller ID. Microsoft never calls people out of the blue about viruses.", flag: true },
    segments: [
      { t: "\"Hello madam, this is the Microsoft Technical Department. " },
      { t: "Your computer is sending us virus alerts and hackers are stealing your bank details right now! ", flag: "fear" },
      { t: "Please install AnyDesk so I can fix it for you ", flag: "remote" },
      { t: "and stay on the line, don't hang up.\"", flag: "urgency" },
    ],
    scam: true,
    risk: 2500,
    grandma: "Hackers?! He sounds so official. Should I let him fix it?",
    ifAllowed: "With control of the laptop, the \"technician\" opened Grandma's online banking and moved $2,500.",
    ifBlocked: "Grandma hangs up. Her laptop was fine all along.",
    lesson: "Tech companies never call to warn you about viruses. Anyone asking you to install AnyDesk or TeamViewer to \"fix\" something is a scammer. Hang up.",
  },
  {
    id: "bookclub",
    day: 1,
    kind: "chat",
    sender: { name: "Book Club 📚 (group)", detail: "A group Grandma joined last year. Margaret is her next-door neighbor." },
    segments: [
      { t: "Margaret: Next meeting is Wed at the library, 3pm! " },
      { t: "We're finishing chapter 12. " },
      { t: "Bring snacks if you can 🍪" },
    ],
    scam: false,
    risk: 0,
    grandma: "Margaret always brings the best biscuits.",
    ifAllowed: "Grandma goes to book club and has a lovely afternoon. 📚",
    ifBlocked: "Grandma left the book club group by accident and missed the meeting. She felt left out.",
    lesson: "People she knows, a normal plan, nothing asked of her. Staying social protects older adults, because scammers target loneliness.",
  },
  {
    id: "bank-signin",
    day: 1,
    kind: "bank",
    sender: { name: "First Harbor Bank (app)", detail: "A notification from the official bank app on Grandma's phone, not a text from a random number." },
    segments: [
      { t: "New sign-in: Chrome on Windows, near your city, today at 4:12 PM. " },
      { t: "If this was you, no action needed. " },
      { t: "If not, open the First Harbor app or call the number on the back of your card. " },
      { t: "We will never ask for your PIN or codes." },
    ],
    scam: false,
    risk: 0,
    grandma: "Oh, that was me! Leo set up my new laptop today.",
    verify: { action: "Call the number on the back of Grandma's card", result: "The bank confirms the alert is theirs, and the sign-in was Grandma's new laptop." },
    ifAllowed: "Grandma recognizes her new laptop and carries on with her day.",
    ifBlocked: "Grandma reported a real bank alert as a scam and got locked out of her account for 2 days.",
    lesson: "Real alerts tell you to use the official app or the number on your card. They don't send links or ask for codes.",
  },

  // ───────── Wednesday ─────────
  {
    id: "hi-mum",
    day: 2,
    kind: "sms",
    sender: { name: "+44 7700 900123", detail: "Not saved in contacts. Grandma's son is saved as \"Daniel 👨\" with a different number.", flag: true },
    segments: [
      { t: "Hi Mum, I dropped my phone in the toilet 😩 this is my new number, save it! ", flag: "emotional" },
      { t: "I need to pay an urgent bill today, can you send $850? ", flag: "payment" },
      { t: "Can't talk right now, ", flag: "secrecy" },
      { t: "I'll pay you back tomorrow xx" },
    ],
    scam: true,
    risk: 850,
    grandma: "Daniel always breaks his phones… poor thing. I should help him.",
    verify: { action: "Call Daniel's saved number", result: "Daniel picks up: \"Mum? My phone's fine, I'm at work! Don't send anyone anything!\"" },
    ifAllowed: "Grandma sent $850 to a stranger. Daniel's phone was never broken.",
    ifBlocked: "Blocked. Grandma calls the real Daniel, who's at work with his phone in one piece.",
    lesson: "The \"Hi Mum, new number\" scam is everywhere. Always call the old, saved number before sending money. The real person will pick up.",
  },
  {
    id: "ssa",
    day: 2,
    kind: "email",
    sender: { name: "Social Security Administration", detail: "Real address: ssa-benefits@govt-alerts.net. Real US government email ends in .gov.", flag: true },
    segments: [
      { t: "URGENT: Your Social Security number has been SUSPENDED due to suspicious activity. ", flag: "fear" },
      { t: "To avoid arrest, call Officer Martin today at 1-202-555-0171 ", flag: "urgency" },
      { t: "and pay the penalty in Apple gift cards.", flag: "payment" },
    ],
    scam: true,
    risk: 1500,
    grandma: "Arrest?! I've never even had a parking ticket!",
    verify: { action: "Look up ssa.gov and call their real number", result: "The real SSA says: \"We never suspend numbers or ask for gift cards. That's a scam.\"" },
    ifAllowed: "\"Officer Martin\" kept Grandma on the phone for 2 hours while she bought $1,500 in gift cards.",
    ifBlocked: "Blocked. Grandma forwards it to her son so he can report it.",
    lesson: "Government agencies don't suspend numbers, threaten arrest by email, or take gift cards. Gift cards as payment = scam, every time.",
  },
  {
    id: "pharmacy",
    day: 2,
    kind: "sms",
    sender: { name: "GoodHealth Pharmacy", detail: "Grandma's usual pharmacy, texting from the number printed on her prescription bag." },
    segments: [
      { t: "Your prescription is ready for pickup at 22 Elm St. " },
      { t: "Store hours 9am–7pm. " },
      { t: "Questions? Ask our pharmacist in store." },
    ],
    scam: false,
    risk: 0,
    grandma: "Good, my blood pressure pills.",
    ifAllowed: "Grandma picks up her blood pressure medicine. 💊",
    ifBlocked: "Grandma didn't get the reminder and ran out of her blood pressure pills for a few days.",
    lesson: "No link, no payment, no pressure. Just information from a place she already uses.",
  },
  {
    id: "romance",
    day: 2,
    kind: "chat",
    sender: { name: "Capt. James Walker 🎖️", detail: "New contact. His profile is 2 weeks old, and the photo appears on other sites under different names.", flag: true },
    segments: [
      { t: "Dear Rosa, your beautiful smile touched my heart ❤️ ", flag: "emotional" },
      { t: "I am a US Army doctor serving overseas. " },
      { t: "I sent you a special gift, but customs needs a $2,500 fee to release it. ", flag: "payment" },
      { t: "Please don't tell your family, they won't understand our love.", flag: "secrecy" },
    ],
    scam: true,
    risk: 2500,
    grandma: "Oh my. He's very charming… and a doctor!",
    ifAllowed: "Grandma paid the \"customs fee\". The gift never came, but more fees did.",
    ifBlocked: "Blocked. Grandma tells Priya about it, and they laugh at his terrible poetry.",
    lesson: "Romance scammers build feelings, then invent a fee. Anyone you've never met asking for money, and for secrecy, is a scammer.",
  },

  // ───────── Thursday ─────────
  {
    id: "payquick-request",
    day: 3,
    kind: "pay",
    sender: { name: "Request from \"Lisa M.\"", detail: "Lisa M. isn't in Grandma's contacts or payment history.", flag: true },
    segments: [
      { t: "Lisa M. is requesting $450.00. " },
      { t: "Note: \"Refund for your overpaid order. Tap APPROVE to receive your money.\" ", flag: "payment" },
      { t: "Request expires in 10 minutes.", flag: "urgency" },
    ],
    scam: true,
    risk: 450,
    grandma: "A refund? How nice. I'll just press Approve…",
    verify: { action: "Check Grandma's real orders", result: "Grandma hasn't overpaid for anything. There's no refund due." },
    ifAllowed: "Approving a request SENDS money. $450 left Grandma's account.",
    ifBlocked: "Declined. You never need to approve anything to receive money.",
    lesson: "On payment apps, \"Approve\" means pay. Receiving money never needs your approval.",
  },
  {
    id: "priya-news",
    day: 3,
    kind: "chat",
    sender: { name: "Priya 🌻 (granddaughter)", detail: "Saved in Grandma's contacts since 2019. Same number as always." },
    segments: [
      { t: "Gran!! I got into the science summer program!!! 🎉🔬 " },
      { t: "Can we video call tonight after dinner?" },
    ],
    scam: false,
    risk: 0,
    grandma: "My clever girl! Of course we can!",
    ifAllowed: "Grandma and Priya video call for an hour. The best part of her week. 💛",
    ifBlocked: "Grandma never saw Priya's big news. Priya thought Gran didn't care. 💔",
    lesson: "Excitement isn't a red flag. Pressure, secrecy and money requests are.",
  },
  {
    id: "netflix",
    day: 3,
    kind: "email",
    sender: { name: "Netflix", detail: "Real address: billing@netflix-account-renew.com, not netflix.com.", flag: true },
    segments: [
      { t: "Your membership is on hold because we couldn't process your last payment. " },
      { t: "Update your payment details within 48 hours or your account will be deleted.", flag: "urgency" },
    ],
    link: { label: "Update Payment", real: "The button goes to netflix-account-renew.com/login, a copycat login page.", flag: true },
    scam: true,
    risk: 400,
    grandma: "Not my Netflix! I'm halfway through my baking show!",
    verify: { action: "Open the real Netflix app", result: "The app says Grandma's membership is active and paid." },
    ifAllowed: "The copycat page took Grandma's card and password. $400 in charges later…",
    ifBlocked: "Deleted. Her baking show is safe. 🧁",
    lesson: "Check where a link really goes before you tap it. To log in, open the app yourself.",
  },
  {
    id: "bank-fraud-alert",
    day: 3,
    kind: "sms",
    sender: { name: "First Harbor Bank", detail: "From 72166, the bank's official short code. The same number has sent Grandma every bank alert for years." },
    segments: [
      { t: "First Harbor Fraud Alert: Did you try a $612.40 purchase at ELECTROWORLD? " },
      { t: "Reply YES or NO. " },
      { t: "We will never ask for your PIN, password or codes." },
    ],
    scam: false,
    risk: 612,
    grandma: "I didn't buy anything at Electroworld!",
    verify: { action: "Call the number on the back of Grandma's card", result: "The bank confirms the alert is real and blocks the stolen card." },
    ifAllowed: "Grandma replies NO. The bank stops the charge and sends a new card. Savings safe!",
    ifBlocked: "Grandma ignored a real fraud alert, and the $612.40 charge went through on her stolen card.",
    lesson: "Real fraud alerts ask a simple yes/no, never ask for codes, and come from the bank's usual number. When in doubt, call the number on the card.",
  },

  // ───────── Friday ─────────
  {
    id: "voice-clone",
    day: 4,
    kind: "voice",
    sender: { name: "Unknown number", detail: "+1 (555) 013-8821. Not Leo's saved number.", flag: true },
    segments: [
      { t: "\"Gran, it's me, Leo… " },
      { t: "I'm in trouble. I crashed a car and the police say I need $3,000 for bail right now. ", flag: "urgency" },
      { t: "Please don't tell Mum, I'm so embarrassed. ", flag: "secrecy" },
      { t: "A lawyer will come by to collect the cash.\"", flag: "payment" },
    ],
    scam: true,
    risk: 3000,
    grandma: "That's Leo's voice! My poor boy… I have to help him!",
    verify: { action: "Call Leo's saved number", result: "Leo answers: \"Gran? I'm in class! I don't even have a car!\" The voice was an AI clone made from his videos online." },
    ifAllowed: "A \"lawyer\" collected $3,000 in cash from Grandma's door. Leo was in class the whole time.",
    ifBlocked: "Blocked. Grandma calls Leo, who is safe in class and very confused.",
    lesson: "AI can copy a voice from a few seconds of video. Agree on a family safe word, and always call back on the saved number.",
  },
  {
    id: "otp",
    day: 4,
    kind: "call",
    sender: { name: "Caller: \"PayQuick Security\"", detail: "Unknown number. PayQuick's real support never calls you first.", flag: true },
    segments: [
      { t: "(Grandma just got a text: \"Your PayQuick code is 482913. Never share this code.\") " },
      { t: "\"Hi Rosa, PayQuick security here. Someone is stealing your money right now! ", flag: "fear" },
      { t: "Read me the 6-digit code we just texted you so we can stop them.\"", flag: "personalInfo" },
    ],
    scam: true,
    risk: 2000,
    grandma: "The text says never share it… but he's from PayQuick, so it's fine?",
    verify: { action: "Hang up and open the real PayQuick app", result: "No suspicious activity. The only one trying to get in is the caller." },
    ifAllowed: "The code let the scammer into Grandma's PayQuick account. $2,000 gone in minutes.",
    ifBlocked: "Grandma hangs up. The code expires, and the account stays locked to her.",
    lesson: "One-time codes are like house keys. Nobody real, not the bank and not support, will ever ask you to read one out.",
  },
  {
    id: "coat-drive",
    day: 4,
    kind: "email",
    sender: { name: "St. Mary's Community Center", detail: "office@stmaryscommunity.org, the center where Grandma volunteers. Same address as every newsletter." },
    segments: [
      { t: "Our winter coat drive starts Monday! 🧥 " },
      { t: "Drop off coats at the front desk, 9am–5pm. " },
      { t: "Questions? Call the office at 555-0133." },
    ],
    scam: false,
    risk: 0,
    grandma: "I have three coats I never wear. Perfect!",
    ifAllowed: "Grandma donates three coats and helps out at the drive. 🧥",
    ifBlocked: "Grandma missed the coat drive she helps with every year.",
    lesson: "Charity messages are trustworthy when they come from a place you already know and don't push for urgent payment.",
  },
  {
    id: "medicare",
    day: 4,
    kind: "sms",
    sender: { name: "Medicare Benefits", detail: "Sent from a random email-to-text address. Medicare doesn't text offers of free equipment.", flag: true },
    segments: [
      { t: "You qualify for a FREE back brace and genetic test! ", flag: "tooGood" },
      { t: "Confirm your Medicare number and date of birth ", flag: "personalInfo" },
      { t: "to ship today. Offer ends tonight.", flag: "urgency" },
    ],
    link: { label: "med-benefits-free.com", real: "med-benefits-free.com, not medicare.gov.", flag: true },
    scam: true,
    risk: 900,
    grandma: "My back has been aching… free sounds lovely.",
    ifAllowed: "Scammers used Grandma's Medicare number to bill for fake equipment and open a loan in her name.",
    ifBlocked: "Blocked. Grandma asks her real doctor about her back instead.",
    lesson: "Never give your ID numbers to someone who contacts you. \"Free\" + \"confirm your details\" + \"today only\" = scam.",
  },
];
