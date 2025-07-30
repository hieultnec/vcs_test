import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Code } from 'lucide-react';
import { scanPrompts, renderUserStoryTemplate, renderTemplate, createCodexUrl, userStoryTemplate } from '@/config/scanPrompts';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  title?: string;
  description?: string;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ 
  isOpen, 
  onClose, 
  initialPrompt,
  title = "Analysis Template Selector",
  description = "Choose a template and open in ChatGPT Codex for analysis"
}) => {
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUserStoryTemplate, setIsUserStoryTemplate] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      const defaultPrompt = initialPrompt || scanPrompts[0]?.prompt || "";
      setPrompt(defaultPrompt);
      setIsUserStoryTemplate(defaultPrompt === userStoryTemplate);
      
      if (defaultPrompt === userStoryTemplate && initialPrompt && initialPrompt.trim()) {
        setCustomPrompt(initialPrompt.trim());
      }
    }
  }, [isOpen, initialPrompt]);

  const handlePromptSelect = (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
    setIsUserStoryTemplate(selectedPrompt === userStoryTemplate);
    if (selectedPrompt !== userStoryTemplate) {
      setCustomPrompt("");
    } else {
      if (initialPrompt && initialPrompt.trim()) {
        setCustomPrompt(initialPrompt.trim());
      }
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPrompt = prompt.trim();
      
      if (prompt.trim() === userStoryTemplate.trim()) {
        if (!customPrompt.trim()) {
          alert('Please enter User Story to replace "{{ prompt }}" in template.');
          setIsSubmitting(false);
          return;
        }
        finalPrompt = renderUserStoryTemplate(customPrompt.trim());
      } else if (prompt.includes('{{ prompt }}')) {
        if (!customPrompt.trim()) {
          alert('Please enter content to replace "{{ prompt }}" in template.');
          setIsSubmitting(false);
          return;
        }
        finalPrompt = renderTemplate(prompt, customPrompt.trim());
      } else {
        finalPrompt = prompt;
      }
      
      const codexUrl = createCodexUrl(finalPrompt);
      window.open(codexUrl, '_blank');
      
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
            <Code className="w-6 h-6 text-blue-600" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
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
                                ✓ Ready to analyze with selected template
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
                placeholder="Enter a custom prompt or use one of the templates above..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={7}
                className="resize-none"
              />
              
              {(isUserStoryTemplate || prompt.includes('{{ prompt }}')) && (
                <div className="mt-4 space-y-2">
                  <label className="block text-sm font-medium">
                    {isUserStoryTemplate ? 'User Story' : 'Template Input'}
                  </label>
                  <Textarea
                    placeholder={isUserStoryTemplate 
                      ? "Enter your user story (e.g., As a user, I want to login so that I can access my account)"
                      : "Enter content for analysis (code, bug report, etc.)"
                    }
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={isUserStoryTemplate ? 2 : 4}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    This will replace the {"{{ prompt }}"} placeholder in the selected template.
                  </p>
                </div>
              )}
            </div>
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
                <ExternalLink className="w-4 h-4 mr-2 animate-spin" />
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

export default TemplateSelector;