'use client';

import Link from 'next/link';

export default function KolFooter() {
  return (
    <footer className="mt-8 flex flex-col items-center justify-between border-t border-muted pt-6 text-xs text-muted-foreground md:flex-row">
      <div>© 2025 BioFox CRM. All rights reserved.</div>
      <div className="mt-4 flex space-x-4 md:mt-0">
        <Link href="#" className="hover:text-primary hover:underline">
          이용약관
        </Link>
        <Link href="#" className="hover:text-primary hover:underline">
          개인정보처리방침
        </Link>
        <Link href="#" className="hover:text-primary hover:underline">
          고객지원
        </Link>
      </div>
    </footer>
  );
} 