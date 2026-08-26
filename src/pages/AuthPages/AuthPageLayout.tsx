// src/layout/AuthLayout.tsx
import React from "react";
import { Link } from "react-router-dom";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  showThemeToggle?: boolean;
}

export default function AuthLayout({
  children,
  title = "Welcome Back",
  subtitle = "Sign in to your account",
  showLogo = true,
  showThemeToggle = true,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Theme Toggler */}
      {showThemeToggle && (
        <div className="fixed top-4 right-4 z-50">
          <ThemeTogglerTwo />
        </div>
      )}

      {/* Logo */}
      {showLogo && (
        <div className="fixed top-4 left-4 z-50">
          <Link to="/" className="inline-block">
            <img
              src="/images/logo/logo.svg"
              alt="Logo"
              className="h-10 w-auto dark:hidden"
            />
            <img
              src="/images/logo/logo-dark.svg"
              alt="Logo"
              className="h-10 w-auto hidden dark:block"
            />
          </Link>
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {title && (
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
