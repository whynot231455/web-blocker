import type { Metadata } from 'next';
import { privateMetadata } from '@/lib/seo';

export const metadata: Metadata = privateMetadata('Block Windows');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
