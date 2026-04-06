import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            FinanceFlow Dashboard
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            A comprehensive finance dashboard system for managing financial records,
            user roles, permissions, and summary-level analytics.
          </p>
        </header>

        
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-white mb-4">
              Manage Your Finances with Role-Based Access
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Our system supports the storage and management of financial entries where
              different users interact with financial records based on their assigned roles.
              Whether you're a viewer tracking personal expenses, an analyst accessing
              insights, or an admin managing the entire system, FinanceFlow provides
              the tools you need.
            </p>

            <div className="space-y-4">
              <h3 className="text-2xl font-semibold text-white">Key Features</h3>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full mr-3"></span>
                  Financial records management (income, expenses, categories)
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full mr-3"></span>
                  Role-based access control (Viewer, Analyst, Admin)
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full mr-3"></span>
                  Dashboard analytics and summary reports
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full mr-3"></span>
                  Secure authentication and user management
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full mr-3"></span>
                  Monthly trends and category-wise breakdowns
                </li>
              </ul>
            </div>
          </div>

          
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-white mb-4">
              User Roles & Permissions
            </h2>

            <div className="space-y-4">
              <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                <h3 className="text-xl font-semibold text-indigo-400 mb-2">Viewer</h3>
                <p className="text-slate-300 mb-3">
                  Can only view dashboard data and their own financial records.
                </p>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• View personal records</li>
                  <li>• Access basic dashboard summaries</li>
                  <li>• No modification permissions</li>
                </ul>
              </div>

              <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                <h3 className="text-xl font-semibold text-green-400 mb-2">Analyst</h3>
                <p className="text-slate-300 mb-3">
                  Can view records and access comprehensive insights and analytics.
                </p>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• View all records and summaries</li>
                  <li>• Access dashboard analytics</li>
                  <li>• Generate reports and trends</li>
                </ul>
              </div>

              <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                <h3 className="text-xl font-semibold text-red-400 mb-2">Admin</h3>
                <p className="text-slate-300 mb-3">
                  Full access to create, update, and manage records and users.
                </p>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Complete CRUD operations</li>
                  <li>• User management</li>
                  <li>• System administration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        
        <div className="text-center">
          <div className="bg-slate-800/30 p-8 rounded-lg border border-slate-700 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Get Started
            </h2>
            <p className="text-slate-300 mb-6">
              Login to access your finance dashboard and manage your financial data.
            </p>
            <Link
              href="/login"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Login to Dashboard
            </Link>
          </div>
        </div>

        
        <footer className="text-center mt-16 text-slate-500">
          <p>&copy; 2026 FinanceFlow Dashboard. Built with Next.js and MongoDB.</p>
        </footer>
      </div>
    </div>
  );
}
