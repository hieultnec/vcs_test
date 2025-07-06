import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, FileText, X, CheckCircle, Settings, Plus, Trash2, Globe, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { projectService, CreateProjectData } from '@/services/projectService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WorkflowVariable {
  id: string;
  variable_name: string;
  key: string;
  value: string;
  type: 'ssh_host' | 'ssh_port' | 'document' | 'custom';
  description?: string;
}

const CreateProject = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    owner: '',
    version: '1.0',
    status: 'draft'
  });
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Variables state
  const [variables, setVariables] = useState<WorkflowVariable[]>([]);

  const totalSteps = 3;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF, DOCX, TXT, or CSV files only",
        variant: "destructive"
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(validateFile);
    
    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      toast({
        title: "Files uploaded successfully",
        description: `${validFiles.length} file(s) added to project`,
      });
    }
    
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(validateFile);
    
    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      toast({
        title: "Files uploaded successfully",
        description: `${validFiles.length} file(s) added to project`,
      });
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Variable management
  const addVariable = () => {
    const newVariable: WorkflowVariable = {
      id: Date.now().toString(),
      variable_name: '',
      key: '',
      value: '',
      type: 'custom',
      description: ''
    };
    setVariables([...variables, newVariable]);
  };

  const updateVariable = (id: string, field: keyof WorkflowVariable, value: string) => {
    setVariables(variables.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const removeVariable = (id: string) => {
    setVariables(variables.filter(v => v.id !== id));
  };

  const getVariableIcon = (type: WorkflowVariable['type']) => {
    switch (type) {
      case 'ssh_host':
      case 'ssh_port':
        return <Server className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getVariableColor = (type: WorkflowVariable['type']) => {
    switch (type) {
      case 'ssh_host':
      case 'ssh_port':
        return 'bg-blue-100 text-blue-800';
      case 'document':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.owner || uploadedFiles.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and upload at least one document",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const createProjectData: CreateProjectData = {
        name: formData.name,
        description: formData.description || undefined,
        owner: formData.owner,
        is_current: true,
        file: uploadedFiles
      };

      const createdProject = await projectService.createProject(createProjectData);
      
      toast({
        title: "Project created successfully",
        description: `Project "${createdProject.name}" has been created with ID: ${createdProject.project_id}`,
      });
      
      navigate(`/project/${createdProject.project_id}`);
      
    } catch (error) {
      console.error('Failed to create project:', error);
      toast({
        title: "Failed to create project",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('word')) return '📝';
    if (file.type.includes('text')) return '📄';
    if (file.type.includes('csv')) return '📊';
    return '📄';
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {step}
            </div>
            {step < totalSteps && (
              <div className={`w-16 h-1 mx-2 ${
                step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Step {currentStep} of {totalSteps}: {
            currentStep === 1 ? 'Project Information' :
            currentStep === 2 ? 'Upload Documents' :
            'Configure Variables (Optional)'
          }
        </p>
      </div>
    </div>
  );

  const renderProjectInfo = () => (
    <Card className="shadow-lg border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Project Information
        </CardTitle>
        <CardDescription>
          Provide basic information about your test project
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Project Name *
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter project name"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner" className="text-sm font-medium text-gray-700">
              Project Owner *
            </Label>
            <Input
              id="owner"
              name="owner"
              value={formData.owner}
              onChange={handleInputChange}
              placeholder="Enter owner name"
              className="w-full"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="version" className="text-sm font-medium text-gray-700">
              Version
            </Label>
            <Input
              id="version"
              name="version"
              value={formData.version}
              onChange={handleInputChange}
              placeholder="1.0"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium text-gray-700">
              Status
            </Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe what this project will test"
            className="w-full min-h-[100px]"
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderDocumentUpload = () => (
    <Card className="shadow-lg border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Upload className="w-5 h-5 mr-2" />
          Upload Documents
        </CardTitle>
        <CardDescription>
          Upload your requirements documents and test specifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {uploadedFiles.length === 0 ? (
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleFileSelect}
          >
            <Upload className={`w-12 h-12 mx-auto mb-4 ${
              isDragOver ? 'text-blue-500' : 'text-gray-400'
            }`} />
            <div className="mb-4">
              <p className="text-lg font-medium text-gray-700">
                {isDragOver ? 'Drop your files here' : 'Drop your files here'}
              </p>
              <p className="text-sm text-gray-500">
                {isDragOver ? 'Release to upload' : 'or click to browse'}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.docx,.txt,.csv"
              multiple
              className="hidden"
            />
            <Button type="button" variant="outline" className="hover:bg-blue-50">
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
            <p className="text-xs text-gray-400 mt-2">
              Supports: PDF, DOCX, TXT, CSV (Max 10MB each)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Uploaded Files ({uploadedFiles.length})</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFileSelect}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add More
              </Button>
            </div>
            
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {getFileIcon(file)} {file.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderVariables = () => (
    <Card className="shadow-lg border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Workflow Variables (Optional)
        </CardTitle>
        <CardDescription>
          Configure variables that will be used in your workflow execution
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {variables.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No workflow variables configured yet.</p>
            <p className="text-sm">Add variables to get started with your workflow.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {variables.map((variable) => (
              <div
                key={variable.id}
                className="border rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getVariableIcon(variable.type)}
                    <Badge variant="secondary" className={getVariableColor(variable.type)}>
                      {variable.type}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariable(variable.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Variable Name</Label>
                    <Input
                      value={variable.variable_name}
                      onChange={(e) => updateVariable(variable.id, 'variable_name', e.target.value)}
                      placeholder="e.g., ssh_host"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={variable.type}
                      onValueChange={(value) => updateVariable(variable.id, 'type', value as WorkflowVariable['type'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ssh_host">SSH Host</SelectItem>
                        <SelectItem value="ssh_port">SSH Port</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Key</Label>
                    <Input
                      value={variable.key}
                      onChange={(e) => updateVariable(variable.id, 'key', e.target.value)}
                      placeholder="e.g., ssh_host"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      value={variable.value}
                      onChange={(e) => updateVariable(variable.id, 'value', e.target.value)}
                      placeholder="e.g., 192.168.1.9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Input
                    value={variable.description || ''}
                    onChange={(e) => updateVariable(variable.id, 'description', e.target.value)}
                    placeholder="Describe what this variable is used for"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={addVariable}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Variable
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Project</h1>
          <p className="text-gray-600">Set up a new test project with documents and workflow variables</p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Form Content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 1 && renderProjectInfo()}
          {currentStep === 2 && renderDocumentUpload()}
          {currentStep === 3 && renderVariables()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={
                  (currentStep === 1 && (!formData.name || !formData.owner)) ||
                  (currentStep === 2 && uploadedFiles.length === 0)
                }
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={isUploading || !formData.name || !formData.owner || uploadedFiles.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Project...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
