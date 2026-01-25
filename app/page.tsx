'use client';

import { Calendar, Car, Users, Eye, BarChart3, Rocket, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { isAuthenticated, user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Car className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">SmartTrack</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">功能</a>
              <a href="#values" className="text-gray-700 hover:text-blue-600 transition-colors">价值</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">联系我们</a>
              {!isLoading && (
                isAuthenticated ? (
                  <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    {user?.name || '控制台'}
                  </Link>
                ) : (
                  <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    登录
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
            SmartTrack
            <span className="block text-3xl sm:text-4xl lg:text-5xl mt-4 text-gray-700">
              智能试车场综合管理系统
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            让试车场管理更智能、更高效、更安全。一站式数字化解决方案，连接人、车、场地与数据。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!isLoading && (
              isAuthenticated ? (
                <Link href="/dashboard" className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto text-center">
                  进入控制台
                </Link>
              ) : (
                <Link href="/login" className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto text-center">
                  立即开始
                </Link>
              )
            )}
            <a href="#features" className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors w-full sm:w-auto text-center">
              了解更多
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">核心业务场景</h2>
            <p className="text-xl text-gray-600">全方位数字化管理，覆盖试车场运营每一环节</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-blue-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">智能预约与排班中心</h3>
              <p className="text-gray-600 leading-relaxed">
                可视化日历，冲突自动避让，灵活策略。告别繁琐的电话与表格，实现场地资源的最优配置。
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl border border-green-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-green-600 rounded-lg flex items-center justify-center mb-6">
                <Car className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">车辆全生命周期档案</h3>
              <p className="text-gray-600 leading-relaxed">
                电子档案，状态追踪，资源调度。每一辆测试车的&ldquo;数字身份证&rdquo;，全程留痕可追溯。
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl border border-purple-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-purple-600 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">角色化工作台</h3>
              <p className="text-gray-600 leading-relaxed">
                试车员扫码领车，管理员实时监控，访客便捷申请。千人千面，专注于各自的核心任务。
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl border border-orange-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-orange-600 rounded-lg flex items-center justify-center mb-6">
                <Eye className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">智慧监控与安防</h3>
              <p className="text-gray-600 leading-relaxed">
                实时看板，智能告警（超速/越界）。上帝视角，掌控全局，确保试车安全零事故。
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-pink-50 to-white p-8 rounded-2xl border border-pink-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-pink-600 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">数字化报表</h3>
              <p className="text-gray-600 leading-relaxed">
                绩效分析，场地热力图。用数据说话，赋能业务增长，优化维护计划。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section id="values" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">核心价值</h2>
            <p className="text-xl text-gray-600">数字化转型，让试车场管理迈向新高度</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Value 1 */}
            <div className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Rocket className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">🚀 运营提效</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                全自动化的预约与冲突检测
              </p>
              <p className="text-4xl font-bold text-blue-600 mt-6">场地利用率提升 30%+</p>
            </div>

            {/* Value 2 */}
            <div className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">🛡️ 安全合规</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                人车身份严格准入，实时监控告警
              </p>
              <p className="text-4xl font-bold text-green-600 mt-6">确保零事故</p>
            </div>

            {/* Value 3 */}
            <div className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">📊 数据驱动</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                全生命周期数据沉淀
              </p>
              <p className="text-4xl font-bold text-purple-600 mt-6">决策有据可依</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Car className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold">SmartTrack</span>
          </div>
          <p className="text-gray-400 mb-8">
            智能试车场综合管理系统 - 让管理更高效
          </p>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-500 text-sm">
              © 2026 SmartTrack. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
