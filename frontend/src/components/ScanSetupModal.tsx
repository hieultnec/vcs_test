import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Play, GitBranch, Star, Lock, Bug, Shield, Code, Search, AlertCircle } from "lucide-react";
import { RootState, AppDispatch } from '@/store/store';
import { fetchRepos, runCodex, clearError } from '@/store/slices/codexSlice';
import { CodexTask, RepoOption } from '@/services/codexService';



const scanPrompts = [
  {
    id: 'security',
    title: 'Security Vulnerabilities',
    description: 'Scan for common security issues and vulnerabilities',
    icon: Shield,
    prompt: 'Analyze the codebase for security vulnerabilities including SQL injection, XSS, CSRF, authentication issues, and insecure data handling.'
  },
  {
    id: 'bugs',
    title: 'Bug Detection',
    description: 'Find potential bugs and logical errors',
    icon: Bug,
    prompt: 'Identify potential bugs, logical errors, null pointer exceptions, memory leaks, and runtime errors in the codebase.'
  },
  {
    id: 'quality',
    title: 'Code Quality',
    description: 'Analyze code quality and best practices',
    icon: Code,
    prompt: 'Review code quality, design patterns, maintainability, performance issues, and adherence to coding standards.'
  },
  {
    id: 'comprehensive',
    title: 'Comprehensive Scan',
    description: 'Full analysis covering all aspects',
    icon: Search,
    prompt: 'Perform a comprehensive analysis covering security vulnerabilities, potential bugs, code quality issues, performance problems, and maintainability concerns.'
  }
];

interface ScanSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanStart?: (task: CodexTask) => void;
  initialPrompt?: string;
}

const ScanSetupModal: React.FC<ScanSetupModalProps> = ({ 
  isOpen, 
  onClose, 
  onScanStart,
  initialPrompt 
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { repos, loading, error, currentTask } = useSelector((state: RootState) => state.codex);
  
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRepoSelector, setShowRepoSelector] = useState(false);

  // Fetch repositories when modal opens
  useEffect(() => {
    if (isOpen && repos.length === 0) {
      dispatch(fetchRepos());
    }
  }, [isOpen, dispatch, repos.length]);

  // Clear error when modal opens and set initial prompt
  useEffect(() => {
    if (isOpen && error) {
      dispatch(clearError());
    }
    if (isOpen) {
      setPrompt(initialPrompt || "");
    }
  }, [isOpen, error, dispatch, initialPrompt]);

  const handlePromptSelect = (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
  };

  const handleRepoSelect = (repoName: string) => {
    setSelectedRepo(repoName);
    setShowRepoSelector(false);
  };

  const handleSubmit = async () => {
    if (!selectedRepo || !prompt.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const resultAction = await dispatch(runCodex({
        prompt: prompt.trim(),
        repo_label: selectedRepo,
      }));
      
      if (runCodex.fulfilled.match(resultAction)) {
        const task = resultAction.payload;
        if (onScanStart) {
          onScanStart(task);
        }
        onClose();
      } else {
        // Error is handled by Redux slice
        console.error('Failed to start scan:', resultAction.error);
      }
    } catch (error) {
      console.error('Failed to start scan:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPrompt("");
    setSelectedRepo(null);
    setShowRepoSelector(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bug className="w-6 h-6 text-blue-600" />
            ByeBug - Advanced Bug & Vulnerability Scanner
          </DialogTitle>
          <DialogDescription>
            Configure your repository scan with custom prompts and target selection
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4 flex-1 overflow-y-auto">
          <div className="space-y-6 overflow-y-auto">
            {/* Scan Prompt Templates */}
            <div>
              <h3 className="text-sm font-medium mb-3">Quick Start Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scanPrompts.map((template) => {
                  const IconComponent = template.icon;
                  return (
                    <Card 
                      key={template.id} 
                      className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                        prompt === template.prompt 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePromptSelect(template.prompt)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            prompt === template.prompt 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">{template.title}</h4>
                            <p className="text-xs text-gray-600">{template.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Custom Prompt */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Custom Prompt (Optional)
              </label>
              <Textarea
                placeholder="Enter a custom scanning prompt or use one of the templates above..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Repository Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Repository *
              </label>
              
              {!showRepoSelector ? (
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => setShowRepoSelector(true)}
                  className="w-full justify-start h-12"
                >
                  <GitBranch className="w-4 h-4 mr-2" />
                  {selectedRepo || "Select Repository"}
                </Button>
              ) : (
                <Card className="border-2 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <GitBranch className="w-4 h-4" />
                      Select Repository
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="max-h-64">
                      <div className="space-y-2">
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            <span className="ml-2 text-sm text-muted-foreground">Loading repositories...</span>
                          </div>
                        ) : error ? (
                          <div className="flex items-center justify-center py-8 text-red-600">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            <span className="text-sm">Failed to load repositories</span>
                          </div>
                        ) : repos.length === 0 ? (
                          <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <span className="text-sm">No repositories found</span>
                          </div>
                        ) : (
                          repos.map((repo, index) => (
                            <div
                              key={index}
                              onClick={() => handleRepoSelect(repo.value)}
                              className="p-3 rounded-lg border hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">{repo.label}</span>
                                    <GitBranch className="w-3 h-3 text-muted-foreground" />
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Repository: {repo.value}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                    <div className="mt-3 pt-3 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowRepoSelector(false)}
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Selected Repository Display */}
            {selectedRepo && !showRepoSelector && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Selected: {selectedRepo}</span>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      Ready to scan
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scan Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="text-center text-sm text-blue-700">
                  <p className="font-medium mb-1">Scan Information</p>
                  <p className="text-xs">Scans typically take 2-5 minutes depending on repository size</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t mt-auto">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedRepo || !prompt.trim()}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Scan
              </>
            )}
          </Button>
        </DialogFooter>
        </DialogContent>
    </Dialog>
  );
};

// Example usage component
const ExampleUsage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleScanStart = (task: CodexTask) => {
    console.log('Scan started with task:', task);
    // Handle scan start logic here
    alert(`Scan started for repository: ${task.repo_label}\nTask ID: ${task.task_id}\nStatus: ${task.status}`);
  };

  return (
    <div className="p-6">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>ByeBug Scanner</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Click the button below to open the scan setup modal.
            </p>
            <Button onClick={() => setIsModalOpen(true)} className="w-full">
              <Bug className="w-4 h-4 mr-2" />
              Open Scan Setup
            </Button>
          </CardContent>
        </Card>
      </div>

      <ScanSetupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onScanStart={handleScanStart}
      />
    </div>
  );
};

export default ScanSetupModal;
export { ExampleUsage }; // Export example for reference