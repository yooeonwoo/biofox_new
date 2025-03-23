import { UserButton, useUser } from "@clerk/nextjs";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { user } = useUser();

  // 사용자 표시 이름 가져오기
  const displayName = user?.fullName || user?.firstName || user?.lastName || user?.username || user?.primaryEmailAddress?.emailAddress;

  return (
    <header className="flex justify-between items-center bg-white border-b p-4 h-16">
      <h1 className="text-2xl font-bold">{title}</h1>
      
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center">
            <span className="mr-2 text-sm text-gray-700">
              {displayName}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        )}
      </div>
    </header>
  );
} 