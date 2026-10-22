import type { Metadata } from 'next';
import { privateMetadata } from '@/lib/seo';

export const metadata: Metadata = privateMetadata('Log In');

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
