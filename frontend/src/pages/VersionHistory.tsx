
import React, { useState } from 'react';
import { ArrowLeft, Clock, User, GitBranch, Eye, RotateCcw, Download, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface Version {
  id: string;
  version: string;
  timestamp: string;
  author: string;
  description: string;
  changes: {
    scenarios: number;
    testCases: number;
    testData: number;
  };
  status: 'current' | 'previous';
}

const mockVersions: Version[] = [
  {
    id: '1',
    version: 'v1.3.0',
    timestamp: '2024-01-15 14:30:22',
    author: 'Sarah Chen',
    description: 'Added authentication test scenarios and updated validation rules',
    changes: {
      scenarios: 5,
      testCases: 12,
      testData: 8
    },
    status: 'current'
  },
  {
    id: '2',
    version: 'v1.2.1',
    timestamp: '2024-01-12 09:15:10',
    author: 'Mike Rodriguez',
    description: 'Fixed edge cases in payment processing tests',
    changes: {
      scenarios: 3,
      testCases: 8,
      testData: 6
    },
    status: 'previous'
  },
  {
    id: '3',
    version: 'v1.2.0',
    timestamp: '2024-01-10 16:45:33',
    author: 'Alex Johnson',
    description: 'Major update with new user management test suite',
    changes: {
      scenarios: 7,
      testCases: 15,
      testData: 10
    },
    status: 'previous'
  },
  {
    id: '4',
    version: 'v1.1.2',
    timestamp: '2024-01-08 11:20:45',
    author: 'Sarah Chen',
    description: 'Performance test improvements and bug fixes',
    changes: {
      scenarios: 4,
      testCases: 9,
      testData: 7
    },
    status: 'previous'
  },
  {
    id: '5',
    version: 'v1.1.0',
    timestamp: '2024-01-05 13:55:18',
    author: 'Mike Rodriguez',
    description: 'Initial mobile app testing framework',
    changes: {
      scenarios: 6,
      testCases: 11,
      testData: 5
    },
    status: 'previous'
  }
];

const VersionHistory = () => {
  const [versions] = useState<Version[]>(mockVersions);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      } else if (prev.length < 2) {
        return [...prev, versionId];
      } else {
        return [prev[1], versionId];
      }
    });
  };

  const handleRollback = (version: Version) => {
    toast({
      title: "Version rollback initiated",
      description: `Rolling back to ${version.version}. This action cannot be undone.`,
    });
  };

  const handleViewDiff = () => {
    if (selectedVersions.length === 2) {
      toast({
        title: "Viewing differences",
        description: `Comparing ${selectedVersions.length} selected versions`,
      });
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Version History</h1>
              <p className="text-gray-600">Track changes and manage versions of your test artifacts</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                disabled={selectedVersions.length !== 2}
                onClick={handleViewDiff}
                className="px-4 py-2"
              >
                <GitCompare className="w-4 h-4 mr-2" />
                View Diff ({selectedVersions.length}/2)
              </Button>
              <Button variant="outline" className="px-4 py-2">
                <Download className="w-4 h-4 mr-2" />
                Export History
              </Button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {selectedVersions.length < 2 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              💡 Select up to 2 versions to compare differences, or click on individual versions to view details.
            </p>
          </div>
        )}

        {/* Version List */}
        <div className="space-y-4">
          {versions.map((version, index) => (
            <Card 
              key={version.id} 
              className={`shadow-md border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer ${
                selectedVersions.includes(version.id) ? 'ring-2 ring-blue-500 border-blue-300' : ''
              }`}
              onClick={() => handleVersionSelect(version.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-5 h-5 text-gray-600" />
                        <h3 className="text-xl font-semibold text-gray-900">{version.version}</h3>
                      </div>
                      {version.status === 'current' && (
                        <Badge className="bg-green-100 text-green-800" variant="secondary">
                          Current
                        </Badge>
                      )}
                      {selectedVersions.includes(version.id) && (
                        <Badge className="bg-blue-100 text-blue-800" variant="secondary">
                          Selected
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-3">{version.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        <span>{version.author}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>
                          {formatDate(version.timestamp).date} at {formatDate(version.timestamp).time}
                        </span>
                      </div>
                    </div>

                    {/* Changes Summary */}
                    <div className="flex flex-wrap gap-3 mb-4">
                      <div className="bg-blue-50 px-3 py-1 rounded-full">
                        <span className="text-sm text-blue-800">
                          {version.changes.scenarios} Scenarios
                        </span>
                      </div>
                      <div className="bg-green-50 px-3 py-1 rounded-full">
                        <span className="text-sm text-green-800">
                          {version.changes.testCases} Test Cases
                        </span>
                      </div>
                      <div className="bg-purple-50 px-3 py-1 rounded-full">
                        <span className="text-sm text-purple-800">
                          {version.changes.testData} Data Sets
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Link to={`/project/demo/workflow`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    {version.status !== 'current' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRollback(version);
                        }}
                        className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Rollback
                      </Button>
                    )}
                  </div>
                </div>

                {/* Timeline Connector */}
                {index < versions.length - 1 && (
                  <div className="absolute left-8 top-full w-px h-4 bg-gray-200"></div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {versions.length === 0 && (
          <div className="text-center py-12">
            <GitBranch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No versions yet</h3>
            <p className="text-gray-500 mb-6">Create your first version by saving test artifacts</p>
            <Link to="/create-project">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Create New Project
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistory;
