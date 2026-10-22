import type { Metadata } from 'next';
import { privateMetadata } from '@/lib/seo';

export const metadata: Metadata = privateMetadata('Account');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
