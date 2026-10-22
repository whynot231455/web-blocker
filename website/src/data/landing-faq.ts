export type FaqItem = {
  question: string;
  answer: string;
};

// Rendered on the landing page and reused for FAQPage structured data, so the
// visible text and the schema can never drift apart.
export const LANDING_FAQ: FaqItem[] = [
  {
    question: 'What is CTRL+BLCK?',
    answer:
      'CTRL+BLCK is a website blocker and focus mode extension for browsers. You build a list of distracting sites, and CTRL+BLCK stops them from loading so you can stay on your work.',
  },
  {
    question: 'Is CTRL+BLCK free?',
    answer: 'Yes. CTRL+BLCK is free to install and use.',
  },
  {
    question: 'Do I need an account to block websites?',
    answer:
      'No. Guest mode works without signing up, and your block list is stored locally in your browser. Create an optional account only if you want your blocked sites synced across browsers and devices.',
  },
  {
    question: 'Can I block a website only at certain times or on certain days?',
    answer:
      'Yes. Give a site a block window with a start time, an end time and the days of the week it applies to, for example weekdays from 9:00 to 17:00. Overnight windows such as 22:00 to 06:00 are supported, and outside the window the site is accessible again.',
  },
  {
    question: 'Which browsers does it work in?',
    answer:
      'CTRL+BLCK works in Google Chrome and other Chromium-based browsers that support extensions, such as Microsoft Edge and Brave.',
  },
  {
    question: 'How do I install the extension?',
    answer:
      'Open the install page, download the extension, then load it as an unpacked extension from your browser’s extensions page with developer mode turned on. The install page walks you through each step and detects when the extension is active.',
  },
  {
    question: 'Does CTRL+BLCK collect my browsing data?',
    answer:
      'No browsing data is sent to a server. The extension reads the address of the current tab only to compare it with your block list, and there are no ads or analytics trackers. Your list lives in your browser unless you create an account to sync it.',
  },
];
