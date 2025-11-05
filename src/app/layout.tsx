import { ReactNode } from 'react';

// Since we are using an internationalized routing, this layout is minimal
// and does not need to contain any logic. It just passes children through.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
