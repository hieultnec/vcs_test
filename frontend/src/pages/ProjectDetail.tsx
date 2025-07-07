import React, { useState, useEffect } from "react";
import { ArrowLeft, Settings, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import TestScenariosTab from "@/components/project-detail/TestScenariosTab";
import DocumentUploadModal from "@/components/project-detail/DocumentUploadModal";

import DocumentManager from "@/components/DocumentManager";
import WorkflowTab from "@/components/project-detail/WorkflowTab";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchProject } from "@/store/slices/projectSlice";
import { fetchScenarios } from "@/store/slices/scenarioSlice";
import ConfigurationTab from '@/components/project-detail/ConfigurationTab';
import ExecutionTab from '@/components/project-detail/ExecutionTab';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    currentProject,
    loading: projectLoading,
    error: projectError,
  } = useAppSelector((state) => state.projects);
  const { scenarios, loading: scenariosLoading } = useAppSelector(
    (state) => state.scenarios
  );

  const [isDocumentUploadOpen, setIsDocumentUploadOpen] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchProject(id));
      dispatch(fetchScenarios(id));
    }
  }, [dispatch, id]);

  const handleDocumentChange = () => {
    // Refresh project data when documents change
    if (id) {
      dispatch(fetchProject(id));
    }
  };

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            Error loading project: {projectError}
          </p>
          <Link to="/" className="text-blue-600 hover:text-blue-700">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Project not found</p>
          <Link to="/" className="text-blue-600 hover:text-blue-700">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const totalTestCases = scenarios.reduce(
    (total, scenario) => total + (scenario.test_cases?.length || 0),
    0
  );

  const documentCount = currentProject.uploaded_documents?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-3"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Projects
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {currentProject.name}
              </h1>
              <p className="text-gray-600 mb-1 text-sm">
                {currentProject.description}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>Version: {currentProject.version}</span>
                <span>Owner: {currentProject.owner}</span>
                <span>
                  Updated:{" "}
                  {new Date(currentProject.lastUpdated).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="px-3 py-1">
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </Button>
              <Button variant="outline" size="sm" className="px-3 py-1">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Horizontal Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex h-fit w-full items-center justify-start rounded-md bg-muted p-1 text-muted-foreground mb-4 overflow-x-auto">
            <TabsTrigger value="overview" className="w-1/6 text-sm px-4 py-2">
              Overview
            </TabsTrigger>
            <TabsTrigger value="workflow" className="w-1/6 text-sm px-4 py-2">
              Workflow
            </TabsTrigger>
            <TabsTrigger value="executions" className="w-1/6 text-sm px-4 py-2">
              Executions
            </TabsTrigger>
            <TabsTrigger value="documents" className="w-1/6 text-sm px-4 py-2">
              Documents
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="w-1/6 text-sm px-4 py-2">
              Test Scenarios
            </TabsTrigger>
            <TabsTrigger value="configuration" className="w-1/6 text-sm px-4 py-2">
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Project Overview</CardTitle>
                  <CardDescription className="text-sm">
                    Summary of test artifacts and recent activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 p-3 rounded-md border border-gray-100">
                      <h3 className="font-medium text-blue-900 text-sm">
                        Test Scenarios
                      </h3>
                      <p className="text-xl font-bold text-blue-700">
                        {scenarios.length}
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-md border border-gray-100">
                      <h3 className="font-medium text-green-900 text-sm">
                        Test Cases
                      </h3>
                      <p className="text-xl font-bold text-green-700">
                        {totalTestCases}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-md border border-gray-100">
                      <h3 className="font-medium text-purple-900 text-sm">
                        Documents
                      </h3>
                      <p className="text-xl font-bold text-purple-700">
                        {documentCount}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-md border border-gray-100">
                      <h3 className="font-medium text-orange-900 text-sm">
                        Test Runs
                      </h3>
                      <p className="text-xl font-bold text-orange-700">8</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          <TabsContent value="workflow">
            <WorkflowTab projectId={id} />
          </TabsContent>

          <TabsContent value="executions">
            <ExecutionTab projectId={id} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentManager projectId={id} onDocumentChange={handleDocumentChange} />
          </TabsContent>

          <TabsContent value="scenarios">
            <TestScenariosTab projectId={id} />
          </TabsContent>

          <TabsContent value="configuration">
            <ConfigurationTab projectId={id} />
          </TabsContent>
        </Tabs>

        <DocumentUploadModal
          isOpen={isDocumentUploadOpen}
          onClose={() => setIsDocumentUploadOpen(false)}
        />


      </div>
    </div>
  );
};

export default ProjectDetail;
