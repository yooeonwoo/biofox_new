'use client';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ReactNode } from 'react';

// Convex client 생성
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);

interface ConvexClientProviderProps {
  children: ReactNode;
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  return (
    <ConvexProvider client={convex}>
      <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>
    </ConvexProvider>
  );
}
