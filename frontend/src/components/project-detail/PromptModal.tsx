
import React, { useState } from 'react';
import { X, RefreshCw, Save, Play, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'scenarios' | 'cases' | 'data';
}

const defaultPrompts = {
  scenarios: `Generate comprehensive test scenarios based on the uploaded document. Focus on:
- Critical user journeys and workflows
- Edge cases and error conditions  
- Security and validation scenarios
- Performance and load considerations
- Integration points with external systems`,
  
  cases: `Create detailed test cases for each scenario including:
- Clear step-by-step instructions
- Expected results and acceptance criteria
- Test data requirements
- Prerequisites and setup steps
- Cleanup and teardown procedures`,
  
  data: `Generate test data sets that include:
- Valid boundary values and typical cases
- Invalid inputs for negative testing
- Edge cases and special characters
- Realistic sample data for different user personas
- Data variations for different test environments`
};

const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  onClose,
  type
}) => {
  const [prompt, setPrompt] = useState(defaultPrompts[type]);
  const [isRunning, setIsRunning] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const getTitle = () => {
    switch (type) {
      case 'scenarios': return 'Run/Regenerate Test Scenarios';
      case 'cases': return 'Run/Regenerate Test Cases';
      case 'data': return 'Run/Regenerate Test Data';
      default: return 'Run Workflow';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'scenarios': return 'Customize and run the AI workflow to generate test scenarios';
      case 'cases': return 'Customize and run the AI workflow to generate test cases';
      case 'data': return 'Customize and run the AI workflow to generate test data';
      default: return 'Customize and run the AI workflow';
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    try {
      // Simulate API call to Dify
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock preview data
      setPreviewData({
        scenarios: ['User Login Flow', 'Payment Processing', 'Profile Management'],
        testCases: ['Valid login', 'Invalid credentials', 'Password reset'],
        data: ['user@example.com', 'invalid@', 'test123@domain.com']
      });
      
      toast({
        title: "Workflow completed successfully",
        description: `${type} have been generated and are ready for review`,
      });
    } catch (error) {
      toast({
        title: "Workflow failed",
        description: "Please try again or contact support if the issue persists",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveAndClose = () => {
    toast({
      title: "Changes saved",
      description: "Your generated content has been saved to the project",
    });
    onClose();
  };

  const handleSavePrompt = () => {
    toast({
      title: "Prompt saved",
      description: "Your custom prompt has been saved for future use",
    });
  };

  const handleReset = () => {
    setPrompt(defaultPrompts[type]);
    setPreviewData(null);
    toast({
      title: "Prompt reset",
      description: "Prompt has been reset to default",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{getTitle()}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Left Column - Prompt Configuration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-sm font-medium text-gray-700">
                AI Prompt Instructions
              </Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[200px] border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                placeholder="Enter your custom prompt instructions..."
              />
              <p className="text-xs text-gray-500">
                Be specific about what you want the AI to focus on when generating {type}.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 Tips for better results:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Be specific about the format you want</li>
                <li>• Include examples of what you're looking for</li>
                <li>• Mention any industry-specific requirements</li>
                <li>• Specify the level of detail needed</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1"
              >
                Reset to Default
              </Button>
              <Button
                variant="outline"
                onClick={handleSavePrompt}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Prompt
              </Button>
            </div>
          </div>

          {/* Right Column - Preview & Results */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview Results</CardTitle>
              </CardHeader>
              <CardContent>
                {previewData ? (
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Generated {type}:</h5>
                      <ul className="space-y-1">
                        {(previewData[type] || []).map((item: string, index: number) => (
                          <li key={index} className="text-sm text-gray-700 flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Run the workflow to see preview results</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {previewData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-medium text-green-900 mb-2">✅ Workflow Complete</h5>
                <p className="text-sm text-green-800">
                  Your {type} have been generated successfully. Review the results and save when ready.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRun}
            disabled={isRunning || !prompt.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Running Workflow...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Workflow
              </>
            )}
          </Button>
          {previewData && (
            <Button
              onClick={handleSaveAndClose}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save & Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromptModal;
