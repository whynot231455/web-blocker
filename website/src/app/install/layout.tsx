import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Install the Chrome Extension',
  description:
    'Install the CTRL+BLCK website blocker in Chrome, Edge or Brave in a few steps and start blocking distracting sites.',
  alternates: { canonical: '/install' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
