import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ExternalLink, GitBranch, Star, Lock, Bug, Shield, Code, Search, AlertCircle } from "lucide-react";
import { RootState, AppDispatch } from '@/store/store';
import { fetchRepos, runCodex, clearError } from '@/store/slices/codexSlice';
import { CodexTask, RepoOption } from '@/services/codexService';
import { scanPrompts, renderUserStoryTemplate, createCodexUrl, userStoryTemplate } from '../config/scanPrompts';



// scanPrompts is now imported from @/config/scanPrompts

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
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [isUserStoryTemplate, setIsUserStoryTemplate] = useState(false);

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
      // Default to first template (User Story) if no initial prompt
      const defaultPrompt = initialPrompt || scanPrompts[0]?.prompt || "";
      setPrompt(defaultPrompt);
      setIsUserStoryTemplate(defaultPrompt === userStoryTemplate);
      
      // If User Story template is selected and we have initialPrompt,
      // automatically fill it into customPrompt
      if (defaultPrompt === userStoryTemplate && initialPrompt && initialPrompt.trim()) {
        setCustomPrompt(initialPrompt.trim());
      }
    }
  }, [isOpen, error, dispatch, initialPrompt]);

  const handlePromptSelect = (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
    setIsUserStoryTemplate(selectedPrompt === userStoryTemplate);
    if (selectedPrompt !== userStoryTemplate) {
      setCustomPrompt("");
    } else {
      // If User Story template is selected and we have initialPrompt (from scenario/test case),
      // automatically fill it into customPrompt
      if (initialPrompt && initialPrompt.trim()) {
        setCustomPrompt(initialPrompt.trim());
      }
    }
  };

  const handleRepoSelect = (repoName: string) => {
    setSelectedRepo(repoName);
    setShowRepoSelector(false);
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPrompt = prompt.trim();
      
      // Check if the current prompt is the userStoryTemplate
      if (prompt.trim() === userStoryTemplate.trim()) {
        // If user selected User Story template, use the custom prompt to replace {{ prompt }}
        if (!customPrompt.trim()) {
          alert('Vui lòng nhập User Story để thay thế cho "{{ prompt }}" trong template.');
          setIsSubmitting(false);
          return;
        }
        finalPrompt = renderUserStoryTemplate(customPrompt.trim());
      } else {
        // For regular prompts, use as is
        finalPrompt = prompt;
      }
      
      // Create ChatGPT Codex URL
      const codexUrl = createCodexUrl(finalPrompt);
      
      // Open ChatGPT Codex in a new tab
      window.open(codexUrl, '_blank');
      
      
      // if (onScanStart) {
      //   onScanStart(mockTask);
      // }
      onClose();
    } catch (error) {
      console.error('Failed to open ChatGPT Codex:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPrompt("");
    setCustomPrompt("");
    setSelectedRepo(null);
    setShowRepoSelector(false);
    setIsUserStoryTemplate(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bug className="w-6 h-6 text-blue-600" />
            ByeBug - ChatGPT Codex Integration
          </DialogTitle>
          <DialogDescription>
            Create User Stories and open them in ChatGPT Codex for advanced analysis
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4 flex-1 overflow-y-auto">
          <div className="space-y-6 overflow-y-auto">
            {/* Scan Prompt Templates */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-600" />
                Analysis Template
              </h3>
              <div className="space-y-3 m-4">
                {scanPrompts.map((template) => {
                  const IconComponent = template.icon;
                  const isSelected = prompt === template.prompt;
                  return (
                    <Card 
                      key={template.id} 
                      className={`cursor-pointer transition-all duration-200 border-2 transform hover:scale-[1.02] select-none ${
                        isSelected
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg' 
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handlePromptSelect(template.prompt);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-3 rounded-xl transition-all duration-200 ${
                            isSelected
                              ? 'bg-blue-500 text-white shadow-lg' 
                              : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100'
                          }`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className={`font-semibold text-base ${
                                isSelected ? 'text-blue-700' : 'text-gray-900'
                              }`}>{template.title}</h4>
                              {isSelected && (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  <span className="text-xs font-medium">Selected</span>
                                </div>
                              )}
                            </div>
                            <p className={`text-sm ${
                              isSelected ? 'text-blue-600' : 'text-gray-600'
                            }`}>{template.description}</p>
                            {isSelected && (
                              <div className="mt-2 text-xs text-blue-500 font-medium">
                                ✓ Ready to analyze your code with User Story context
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Custom Prompt */}
            <div className="m-4">
              <label className="block text-sm font-medium mb-2">
                Custom Prompt (Optional)
              </label>
              <Textarea
                placeholder="Enter a custom scanning prompt or use one of the templates above..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={7}
                className="resize-none"
              />
              
              {isUserStoryTemplate && (
                <div className="mt-4 space-y-2">
                  <label className="block text-sm font-medium">
                    User Story
                  </label>
                  <Textarea
                    placeholder="Enter your user story (e.g., As a user, I want to login so that I can access my account)"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    This will replace the {"{{ prompt }}"} placeholder in the User Story template.
                  </p>
                </div>
              )}
            </div>

            {/* Repository Selection - Hidden for ChatGPT Codex integration */}
            {/* <div>
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
            </div> */}

            {/* Selected Repository Display - Hidden for ChatGPT Codex integration */}
            {/* {selectedRepo && !showRepoSelector && (
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
            )} */}

            {/* ChatGPT Codex Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="text-center text-sm text-blue-700">
                  <p className="font-medium mb-1">ChatGPT Codex Integration</p>
                  <p className="text-xs">Generate user stories and open them in ChatGPT Codex for advanced analysis</p>
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
            disabled={isSubmitting || !prompt.trim()}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Opening...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Codex
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