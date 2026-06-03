import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Calendar, Settings } from 'lucide-react';

const BottomNav = () => {
  const navItems = [
    { path: '/', label: 'الرئيسية', icon: Home },
    { path: '/doctors', label: 'الدكاتره', icon: Users },
    { path: '/visits', label: 'الزيارات', icon: Calendar },
    { path: '/settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 md:max-w-md md:mx-auto md:rounded-t-2xl">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-2 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-blue-600 scale-105'
                    : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-1" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
