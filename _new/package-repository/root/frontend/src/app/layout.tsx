'use client';

import '@shared/scss/globals.scss';
import '../styles/globals.scss';
import Navbar from '../components/Navbar';

/** Props for the root layout component. */
interface RootLayoutProps {
  /** Child page content to render. */
  children: React.ReactNode;
}

/**
 * Root layout wrapping all pages with the navbar.
 * @param props - Layout props containing children.
 * @returns The root HTML structure.
 */
export default function RootLayout(
  { children }: RootLayoutProps,
) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
