import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronRight, X, Edit2 } from 'lucide-react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchBugs, fetchBugFixes, createBug, updateBug, deleteBug, createBugFix } from '@/store/slices/bugSlice';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BugTabProps {
  projectId: string;
}

const BugTab: React.FC<BugTabProps> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  const { bugs, bugFixes, loading } = useAppSelector((state) => state.bugs);
  const [expandedBugs, setExpandedBugs] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
  });

  useEffect(() => {
    dispatch(fetchBugs({ projectId, filters }));
  }, [dispatch, projectId, filters]);

  const toggleBugExpansion = async (bugId: string) => {
    const newExpandedBugs = new Set(expandedBugs);
    if (expandedBugs.has(bugId)) {
      newExpandedBugs.delete(bugId);
    } else {
      newExpandedBugs.add(bugId);
      if (!bugFixes[bugId]) {
        dispatch(fetchBugFixes(bugId));
      }
    }
    setExpandedBugs(newExpandedBugs);
  };

  const BugForm = ({ onSubmit, initialData = null, mode = 'create' }) => {
    const [formData, setFormData] = useState({
      summary: initialData?.summary || '',
      description: initialData?.description || '',
      severity: initialData?.severity || 'medium',
      status: initialData?.status || 'open',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="summary">Summary</Label>
          <Input
            id="summary"
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select
              value={formData.severity}
              onValueChange={(value) => setFormData({ ...formData, severity: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" className="w-full">
          {mode === 'create' ? 'Create Bug' : 'Update Bug'}
        </Button>
      </form>
    );
  };

  const handleCreateBug = async (formData: any) => {
    await dispatch(createBug({
      project_id: projectId,
      ...formData,
      created_by: 'user', // Replace with actual user ID
    }));
    setIsCreateDialogOpen(false);
  };

  const handleUpdateBug = async (bugId: string, formData: any) => {
    await dispatch(updateBug({ bugId, updateData: formData }));
  };

  const handleDeleteBug = async (bugId: string) => {
    if (window.confirm('Are you sure you want to delete this bug?')) {
      await dispatch(deleteBug(bugId));
    }
  };

  const handleCreateFix = async (bugId: string, fixDescription: string) => {
    await dispatch(createBugFix({
      bug_id: bugId,
      fix_description: fixDescription,
      fixed_by: 'user', // Replace with actual user ID
      fix_status: 'pending',
    }));
  };

  const renderBugFixes = (bugId: string) => {
    const fixes = bugFixes[bugId] || [];
    return (
      <div className="pl-8 mt-2 space-y-2">
        <h4 className="font-semibold text-sm">Fix History</h4>
        {fixes && fixes.map((fix) => (
          <div key={fix.id} className="bg-gray-50 p-2 rounded-md text-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{fix.fix_description}</p>
                <p className="text-gray-500 text-xs">
                  Fixed by {fix.fixed_by} on {new Date(fix.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                fix.fix_status === 'verified' ? 'bg-green-100 text-green-800' :
                fix.fix_status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {fix.fix_status}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Bug Tracking</CardTitle>
            <CardDescription>Manage and track project bugs</CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Bug
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Bug</DialogTitle>
              </DialogHeader>
              <BugForm onSubmit={handleCreateBug} mode="create" />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-4">
          <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.severity} onValueChange={(value) => setFilters({ ...filters, severity: value })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bugs && bugs.map((bug) => (
                <React.Fragment key={bug.id}>
                  <TableRow>
                    <TableCell>
                      <button
                        onClick={() => toggleBugExpansion(bug.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {expandedBugs.has(bug.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>{bug.summary}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        bug.status === 'closed' ? 'bg-green-100 text-green-800' :
                        bug.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        bug.status === 'resolved' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {bug.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        bug.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        bug.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        bug.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {bug.severity}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(bug.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Bug</DialogTitle>
                            </DialogHeader>
                            <BugForm
                              onSubmit={(formData) => handleUpdateBug(bug.id, formData)}
                              initialData={bug}
                              mode="edit"
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBug(bug.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedBugs.has(bug.id) && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-gray-50">
                        <div className="p-4">
                          <h4 className="font-semibold mb-2">Description</h4>
                          <p className="text-sm mb-4">{bug.description}</p>
                          {renderBugFixes(bug.id)}
                          <div className="mt-4">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Fix
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add Bug Fix</DialogTitle>
                                </DialogHeader>
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const description = (form.elements.namedItem('fixDescription') as HTMLTextAreaElement).value;
                                    handleCreateFix(bug.id, description);
                                    form.reset();
                                  }}
                                  className="space-y-4"
                                >
                                  <div className="space-y-2">
                                    <Label htmlFor="fixDescription">Fix Description</Label>
                                    <Textarea
                                      id="fixDescription"
                                      name="fixDescription"
                                      required
                                    />
                                  </div>
                                  <Button type="submit">Submit Fix</Button>
                                </form>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BugTab;