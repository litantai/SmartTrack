import { Car } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Car className="h-10 w-10 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">SmartTrack</span>
          </div>
          <p className="text-gray-600">智能试车场综合管理系统</p>
        </div>

        {/* Content */}
        {children}

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          © 2026 SmartTrack. All rights reserved.
        </p>
      </div>
    </div>
  );
}
