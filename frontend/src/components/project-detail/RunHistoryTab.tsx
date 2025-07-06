
import React, { useState } from 'react';
import { Play, MessageSquare, GitCompare, Camera, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TestRun {
  id: string;
  runDate: string;
  promptUsed: string;
  runBy: string;
  status: 'Pass' | 'Fail' | 'Warning';
  scenariosRun: number;
  testCasesRun: number;
  comments?: string;
}

interface RunHistoryTabProps {
  onOpenPromptModal: () => void;
}

const mockRuns: TestRun[] = [
  {
    id: 'RUN-001',
    runDate: '2024-01-15 14:30:22',
    promptUsed: 'Generate comprehensive test scenarios for e-commerce platform...',
    runBy: 'Sarah Chen',
    status: 'Pass',
    scenariosRun: 12,
    testCasesRun: 47,
    comments: 'All tests passed successfully'
  },
  {
    id: 'RUN-002', 
    runDate: '2024-01-14 10:15:45',
    promptUsed: 'Focus on payment processing edge cases and error handling...',
    runBy: 'Mike Rodriguez',
    status: 'Warning',
    scenariosRun: 8,
    testCasesRun: 23,
    comments: 'Some test cases need review'
  },
  {
    id: 'RUN-003',
    runDate: '2024-01-13 16:45:12',
    promptUsed: 'Generate user registration validation scenarios...',
    runBy: 'Alex Johnson',
    status: 'Fail',
    scenariosRun: 5,
    testCasesRun: 15,
    comments: 'Failed on email validation tests'
  }
];

const RunHistoryTab: React.FC<RunHistoryTabProps> = ({ onOpenPromptModal }) => {
  const [runs] = useState<TestRun[]>(mockRuns);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pass': return 'bg-green-100 text-green-800';
      case 'Fail': return 'bg-red-100 text-red-800';
      case 'Warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pass': return '✅';
      case 'Fail': return '❌';
      case 'Warning': return '⚠️';
      default: return '●';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Test Run History</CardTitle>
          <Button variant="outline" size="sm" onClick={onOpenPromptModal}>
            <Play className="w-4 h-4 mr-2" />
            New Run
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {runs.map((run) => (
            <Card key={run.id} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getStatusIcon(run.status)}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{run.id}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span>{formatDate(run.runDate).date} at {formatDate(run.runDate).time}</span>
                        <span>•</span>
                        <span>By {run.runBy}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(run.status)} variant="secondary">
                    {run.status}
                  </Badge>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Prompt:</strong> {run.promptUsed.substring(0, 100)}...
                  </p>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>{run.scenariosRun} scenarios</span>
                    <span>{run.testCasesRun} test cases</span>
                  </div>
                </div>

                {run.comments && (
                  <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                    <strong>Comment:</strong> {run.comments}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Camera className="w-4 h-4 mr-1" />
                    View Evidence
                  </Button>
                  <Button variant="outline" size="sm" onClick={onOpenPromptModal}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Re-run
                  </Button>
                  <Button variant="outline" size="sm" onClick={onOpenPromptModal}>
                    <Play className="w-4 h-4 mr-1" />
                    Run with New Prompt
                  </Button>
                  <Button variant="outline" size="sm">
                    <GitCompare className="w-4 h-4 mr-1" />
                    Compare
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Comment
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RunHistoryTab;
