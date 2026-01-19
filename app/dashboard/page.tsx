import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { signOut } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">SmartTrack Dashboard</h1>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                退出登录
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">欢迎回来！</h2>
          <div className="space-y-2">
            <p className="text-gray-600">
              <span className="font-semibold">姓名：</span>
              {session.user.name}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">邮箱：</span>
              {session.user.email}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">角色：</span>
              {session.user.role}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
