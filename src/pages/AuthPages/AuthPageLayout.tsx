// src/layout/AuthLayout.tsx
import React from "react";
import { Link } from "react-router-dom";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900">
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        {/* Theme Toggler - Top Right */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeTogglerTwo />
        </div>

        {/* Main Content - Centered */}
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
