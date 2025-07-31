import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Projects from '@/components/Projects';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">InnoLab - ByeBug</h1>
              <p className="text-gray-600">Manage your test projects and track version history</p>
            </div>
            <Link to="/create-project">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="w-5 h-5 mr-2" />
                Create New Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Projects Component */}
        <Projects />
      </div>
    </div>
  );
};

export default Dashboard;
