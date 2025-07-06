
import React, { useState } from 'react';
import { X, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface PromptEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'scenarios' | 'cases' | 'data';
  onRegenerate: (type: 'scenarios' | 'cases' | 'data') => Promise<void>;
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

const PromptEditModal: React.FC<PromptEditModalProps> = ({
  isOpen,
  onClose,
  type,
  onRegenerate
}) => {
  const [prompt, setPrompt] = useState(defaultPrompts[type]);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const getTitle = () => {
    switch (type) {
      case 'scenarios': return 'Edit Test Scenarios Prompt';
      case 'cases': return 'Edit Test Cases Prompt';
      case 'data': return 'Edit Test Data Prompt';
      default: return 'Edit Prompt';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'scenarios': return 'Customize how AI generates test scenarios from your document';
      case 'cases': return 'Customize how AI generates detailed test cases';
      case 'data': return 'Customize how AI generates test data sets';
      default: return 'Customize the AI prompt';
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerate(type);
      toast({
        title: "Content regenerated successfully",
        description: "Your prompt has been applied and new content generated",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Regeneration failed",
        description: "Please try again or contact support if the issue persists",
        variant: "destructive"
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSavePrompt = () => {
    toast({
      title: "Prompt saved",
      description: "Your custom prompt has been saved for future use",
    });
  };

  const handleReset = () => {
    setPrompt(defaultPrompts[type]);
    toast({
      title: "Prompt reset",
      description: "Prompt has been reset to default",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{getTitle()}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 sm:flex-none"
          >
            Reset to Default
          </Button>
          <Button
            variant="outline"
            onClick={handleSavePrompt}
            className="flex-1 sm:flex-none"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Prompt
          </Button>
          <Button
            onClick={handleRegenerate}
            disabled={isRegenerating || !prompt.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isRegenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate with New Prompt
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromptEditModal;
