import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useParams } from "react-router-dom";
import WorkflowTab from "@/components/project-detail/WorkflowTab";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchProject } from "@/store/slices/projectSlice";

const ProjectDetail = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const {
    currentProject,
    loading: projectLoading,
    error: projectError,
  } = useAppSelector((state) => state.projects);

  useEffect(() => {
    if (id) {
      dispatch(fetchProject(id));
    }
  }, [dispatch, id]);

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
                  Updated: {new Date(currentProject.lastUpdated).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Tabs: Overview | Workflow */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex h-fit w-full items-center justify-start rounded-md bg-muted p-1 text-muted-foreground mb-4 overflow-x-auto">
            <TabsTrigger value="overview" className="w-1/2 text-sm px-4 py-2">
              Overview
            </TabsTrigger>
            <TabsTrigger value="workflow" className="w-1/2 text-sm px-4 py-2">
              Workflow
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
                  {/* You can add project summary info here if needed */}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="workflow">
            <WorkflowTab projectId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectDetail;
