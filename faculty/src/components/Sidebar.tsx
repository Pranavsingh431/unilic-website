'use client';

import { User } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  GraduationCap,
  LogOut, 
  User as UserIcon,
  Settings
} from 'lucide-react';
import { classNames } from '@/lib/utils';

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Marks & Grading', href: '/dashboard/upload-marks', icon: GraduationCap },
    { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="border-b border-border p-6">
        <div className="flex items-center space-x-3">
          <Image 
            src="/logo.png" 
            alt="Unilic" 
            width={40} 
            height={40}
            className="rounded-lg"
          />
          <div>
            <h1 className="text-xl font-semibold text-textPrimary">Unilic</h1>
            <p className="text-xs text-textSecondary">Faculty Portal</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="border-b border-border p-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
            {user.avatar ? (
              <Image 
                src={user.avatar} 
                alt={user.name} 
                width={48} 
                height={48}
                className="rounded-full"
              />
            ) : (
              <span className="text-lg font-bold text-primary">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium text-textPrimary">{user.name}</p>
            <p className="truncate text-sm text-textSecondary">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch
              className={classNames(
                'flex items-center space-x-3 rounded-xl px-4 py-3 transition',
                isActive
                  ? 'bg-primary text-white shadow-soft'
                  : 'text-textSecondary hover:bg-surfaceLight hover:text-textPrimary'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-border p-4">
        <button
          onClick={onLogout}
          className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-red-600 transition hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
}
