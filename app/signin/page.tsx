'use client';

import React from 'react';
import { SimpleAuthForm } from '@/components/auth/SimpleAuthForm';

export default function SignInPage() {
  return <SimpleAuthForm initialTab="dev" />;
}
