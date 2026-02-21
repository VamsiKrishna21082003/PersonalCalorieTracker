'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-2xl text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Personal Calorie Tracker
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Track your calories, set nutrition goals, and achieve your health objectives with AI-powered insights.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Get Started
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">🎯 Goal Setting</h3>
              <p className="text-gray-600">Set daily calorie and macro targets to reach your fitness goals.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">📊 Analytics</h3>
              <p className="text-gray-600">View detailed reports and charts of your nutrition progress.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-2">🤖 AI Powered</h3>
              <p className="text-gray-600">Extract nutrition data from images and get personalized advice.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
