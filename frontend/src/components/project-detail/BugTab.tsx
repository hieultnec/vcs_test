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
import { Plus, ChevronDown, ChevronRight, X, Edit2, Search, MoreHorizontal, Filter, Download, Upload } from 'lucide-react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchBugs, fetchBugFixes, createBug, updateBug, deleteBug, createBugFix, createBugsBatch } from '@/store/slices/bugSlice';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { createCodexUrl } from '@/config/scanPrompts';
import TemplateSelector from '@/components/ui/template-selector';

interface BugTabProps {
  projectId: string;
}

const BugTab: React.FC<BugTabProps> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  const { bugs, bugFixes, loading } = useAppSelector((state) => state.bugs);
  const [expandedBugs, setExpandedBugs] = useState<Set<string>>(new Set());
  const [expandedFixes, setExpandedFixes] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBatchImportDialogOpen, setIsBatchImportDialogOpen] = useState(false);
  const [isAnalyzeDialogOpen, setIsAnalyzeDialogOpen] = useState(false);
  const [selectedBugForAnalysis, setSelectedBugForAnalysis] = useState<any>(null);
  const [addFixDialogOpen, setAddFixDialogOpen] = useState<{[bugId: string]: boolean}>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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

  const BugFixForm = ({ onSubmit }) => {
    const [formData, setFormData] = useState({
      description: '',
      images: [],
    });
    const [isUploading, setIsUploading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
      setFormData({ description: '', images: [] });
    };

    const convertToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      setIsUploading(true);
      try {
        const base64Images = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.startsWith('image/')) {
            const base64 = await convertToBase64(file);
            base64Images.push(base64);
          }
        }
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...base64Images]
        }));
      } catch (error) {
        console.error('Error uploading images:', error);
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    };

    const removeImage = (index: number) => {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fixDescription">Fix Description</Label>
          <Textarea
            id="fixDescription"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="images">Images</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <label htmlFor="fix-image-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    {isUploading ? 'Uploading...' : 'Click to upload images'}
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB each
                  </span>
                </label>
                <input
                  id="fix-image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            </div>
          </div>
          
          {formData.images.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Uploaded Images ({formData.images.length})</h4>
              <div className="grid grid-cols-2 gap-2">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button type="submit" className="w-full">
          Submit Fix
        </Button>
      </form>
    );
  };

  const BugForm = ({ onSubmit, initialData = null, mode = 'create' }) => {
    const [formData, setFormData] = useState({
      summary: initialData?.summary || '',
      description: initialData?.description || '',
      severity: initialData?.severity || 'medium',
      status: initialData?.status || 'open',
      images: initialData?.images || [],
    });
    const [isUploading, setIsUploading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    const convertToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      setIsUploading(true);
      try {
        const base64Images = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.startsWith('image/')) {
            const base64 = await convertToBase64(file);
            base64Images.push(base64);
          }
        }
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...base64Images]
        }));
      } catch (error) {
        console.error('Error uploading images:', error);
      } finally {
        setIsUploading(false);
        // Reset input
        e.target.value = '';
      }
    };

    const removeImage = (index: number) => {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
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

        <div className="space-y-2">
          <Label htmlFor="images">Images</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <label htmlFor="image-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    {isUploading ? 'Uploading...' : 'Click to upload images'}
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB each
                  </span>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            </div>
          </div>
          
          {formData.images.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Uploaded Images ({formData.images.length})</h4>
              <div className="grid grid-cols-2 gap-2">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button type="submit" className="w-full">
          {mode === 'create' ? 'Create Bug' : 'Update Bug'}
        </Button>
      </form>
    );
  };

  interface BugFormData {
    summary: string;
    description: string;
    severity: string;
    status: string;
    images?: string[];
  }

  const handleCreateBug = async (formData: BugFormData) => {
    await dispatch(createBug({
      project_id: projectId,
      ...formData,
      created_by: 'user', // Replace with actual user ID
    }));
    setIsCreateDialogOpen(false);
  };

  const handleBatchImport = async (jsonData: string) => {
    try {
      const parsedData = JSON.parse(jsonData);
      
      // Validate the structure
      if (!parsedData.bugs || !Array.isArray(parsedData.bugs)) {
        throw new Error('Invalid format: "bugs" array is required');
      }

      // Preprocess the data to match backend expectations
      const batchData = {
        project_id: projectId,
        task_id: parsedData.task_id || undefined,
        scenario_id: parsedData.scenario_id || undefined,
        bugs: parsedData.bugs.map((bug: any) => ({
          summary: bug.summary || '',
          description: bug.description || '',
          severity: bug.severity?.toLowerCase() || 'medium',
          status: bug.status || 'open',
          created_by: bug.created_by || 'system',
          environment: bug.environment || undefined
        }))
      };

      // Validate required fields for each bug
      for (const bug of batchData.bugs) {
        if (!bug.summary || !bug.description) {
          throw new Error('Each bug must have summary and description');
        }
      }

      await dispatch(createBugsBatch(batchData));
      setIsBatchImportDialogOpen(false);
    } catch (error) {
      alert(`Error importing bugs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateBug = async (bugId: string, formData: BugFormData) => {
    await dispatch(updateBug({ bugId, updateData: formData }));
  };

  const handleDeleteBug = async (bugId: string) => {
    if (window.confirm('Are you sure you want to delete this bug?')) {
      await dispatch(deleteBug(bugId));
    }
  };

  const handleCreateFix = async (bugId: string, fixDescription: string, images?: string[]) => {
    await dispatch(createBugFix({
      bug_id: bugId,
      fix_description: fixDescription,
      fixed_by: 'user', // Replace with actual user ID
      fix_status: 'pending',
      images: images || [],
    }));
    // Close the dialog after successful submission
    setAddFixDialogOpen(prev => ({ ...prev, [bugId]: false }));
  };

  const toggleFixExpansion = (fixId: string) => {
    const newExpandedFixes = new Set(expandedFixes);
    if (expandedFixes.has(fixId)) {
      newExpandedFixes.delete(fixId);
    } else {
      newExpandedFixes.add(fixId);
    }
    setExpandedFixes(newExpandedFixes);
  };

  const renderBugFixes = (bugId: string) => {
    const fixes = bugFixes[bugId] || [];

    return (
      <div className="pl-8 mt-2 space-y-2">
        <h4 className="font-semibold text-sm">Fix History</h4>
        {fixes && fixes.map((fix, index) => (
          <div key={fix.id} className="border rounded-md">
            {/* Fix Version Header */}
            <div 
              className="bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleFixExpansion(fix.id)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {expandedFixes.has(fix.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <h5 className="font-medium text-sm">Fix Version {index + 1}</h5>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    fix.fix_status === 'verified' ? 'bg-green-100 text-green-800' :
                    fix.fix_status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {fix.fix_status}
                  </span>
                </div>
                <p className="text-gray-500 text-xs">
                  Fixed by {fix.fixed_by} on {new Date(fix.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {/* Fix Details (Collapsible) */}
            {expandedFixes.has(fix.id) && (
              <div className="p-4 bg-white border-t">
                <div className="space-y-3">
                  <div>
                    <h6 className="font-medium text-sm mb-2">Description:</h6>
                    <p className="text-sm text-gray-700">{fix.fix_description}</p>
                  </div>
                  
                  {fix.images && fix.images.length > 0 && (
                    <div>
                      <h6 className="font-medium text-sm mb-2">Images ({fix.images.length}):</h6>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {fix.images.map((image, imgIndex) => (
                          <div key={imgIndex} className="relative group">
                            <img
                              src={image}
                              alt={`Fix ${index + 1} - Image ${imgIndex + 1}`}
                              className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setSelectedImage(image)}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded flex items-center justify-center">
                              <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                Click to view
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
          <Dialog open={isBatchImportDialogOpen} onOpenChange={setIsBatchImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Batch Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Batch Import Bugs</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const jsonData = (form.elements.namedItem('jsonData') as HTMLTextAreaElement).value;
                  handleBatchImport(jsonData);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="jsonData">JSON Data</Label>
                  <Textarea
                    id="jsonData"
                    name="jsonData"
                    placeholder={`{
  "task_id": "optional_task_id",
  "scenario_id": "optional_scenario_id",
  "bugs": [
    {
      "summary": "Bug summary",
      "description": "Bug description",
      "severity": "Critical",
      "status": "open",
      "created_by": "system"
    }
  ]
}`}
                    className="min-h-[300px] font-mono text-sm"
                    required
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Format:</strong> JSON object with "bugs" array</p>
                  <p><strong>Required fields per bug:</strong> summary, description</p>
                  <p><strong>Optional fields:</strong> severity (default: medium), status (default: open), created_by (default: system), task_id, scenario_id</p>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Import Bugs
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      const form = document.querySelector('form') as HTMLFormElement;
                      const jsonData = (form.elements.namedItem('jsonData') as HTMLTextAreaElement).value;
                      if (!jsonData.trim()) {
                        alert('Please enter JSON data first');
                        return;
                      }
                      
                      try {
                        // Validate JSON format
                        JSON.parse(jsonData);
                        
                        // Create analysis prompt with the JSON data
                        const analysisPrompt = `Analyze the following bug report data and provide insights:\n\n${jsonData}\n\nPlease review each bug for:\n- Severity assessment\n- Potential security implications\n- Recommended fixes\n- Priority ranking`;
                        
                        // Open ChatGPT Codex with the analysis prompt
                        const codexUrl = createCodexUrl(analysisPrompt);
                        window.open(codexUrl, '_blank');
                      } catch (error) {
                        alert('Invalid JSON format. Please check your data.');
                      }
                    }}
                  >
                    Run Analysis
                  </Button>
                </div>
              </form>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedBugForAnalysis(bug);
                            setIsAnalyzeDialogOpen(true);
                          }}>
                            <Search className="mr-2 h-4 w-4" />
                            Analyze
                          </DropdownMenuItem>
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
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
                          <DropdownMenuItem 
                            onClick={() => handleDeleteBug(bug.id)}
                            className="text-red-600"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                            <Dialog 
                              open={addFixDialogOpen[bug.id] || false} 
                              onOpenChange={(open) => setAddFixDialogOpen(prev => ({ ...prev, [bug.id]: open }))}
                            >
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
                                <BugFixForm
                                  onSubmit={(formData) => {
                                    handleCreateFix(bug.id, formData.description, formData.images);
                                  }}
                                />
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
      
      {/* Template Selector for Bug Analysis */}
      <TemplateSelector
        isOpen={isAnalyzeDialogOpen}
        onClose={() => {
          setIsAnalyzeDialogOpen(false);
          setSelectedBugForAnalysis(null);
        }}
        initialPrompt={selectedBugForAnalysis ? 
          `Role: Senior Developer\n\nAction: Fix bug based on the following summary and description:\n\nSummary: ${selectedBugForAnalysis.summary}\nDescription: ${selectedBugForAnalysis.description}\nSeverity: ${selectedBugForAnalysis.severity}\nStatus: ${selectedBugForAnalysis.status}
\n\nAfter completing the fix, add a log entry with the following details: Summary-What was fixed, Location-Describe where the fix was made (e.g. which file and the specific line number),Details-What exactly was changed/fixed` 
          : undefined
        }
        title="Bug Analysis"
        description="Analyze the selected bug using AI templates"
      />
      
      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img 
              src={selectedImage} 
              alt="Full size view" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default BugTab;