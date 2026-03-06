import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { Project } from '@/types/projects';
import { SearchesTab } from '@/components/projects/tabs/SearchesTab';
import { PatentsTab } from '@/components/projects/tabs/PatentsTab';
import { NotesTab } from '@/components/projects/tabs/NotesTab';
import { TeamTab } from '@/components/projects/tabs/TeamTab';
import { getProjectDetail } from '@/lib/projectRepository';

export const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedSearchIds, setSelectedSearchIds] = useState<number[]>([]);

  const projectIdNum = projectId ? parseInt(projectId, 10) : null;

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', projectIdNum],
    queryFn: async () => {
      if (!projectIdNum) throw new Error('Invalid project ID');
      return getProjectDetail(projectIdNum);
    },
    enabled: !!projectIdNum,
  });

  if (!projectIdNum) {
    return <div className="text-center py-12">Invalid project ID</div>;
  }

  if (isLoading) {
    return <div className="flex justify-center py-12">Loading project...</div>;
  }

  const project: Project = projectData?.project;

  if (!project) {
    return <div className="text-center py-12">Project not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/projects" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Share</Button>
            <Button variant="outline">Settings</Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="searches" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="searches">Searches</TabsTrigger>
          <TabsTrigger value="patents">Patents</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="searches">
            <SearchesTab
              projectId={projectIdNum}
              searches={projectData?.searches || []}
              selectedSearchIds={selectedSearchIds}
              onSelectSearch={(id) =>
                setSelectedSearchIds((prev) =>
                  prev.includes(id)
                    ? prev.filter((x) => x !== id)
                    : [...prev, id]
                )
              }
            />
          </TabsContent>

          <TabsContent value="patents">
            <PatentsTab
              projectId={projectIdNum}
              patents={projectData?.pinnedPatents || []}
              collections={projectData?.collections || []}
            />
          </TabsContent>

          <TabsContent value="notes">
            <NotesTab
              projectId={projectIdNum}
              comments={projectData?.comments || []}
            />
          </TabsContent>

          <TabsContent value="team">
            <TeamTab
              projectId={projectIdNum}
              shares={projectData?.shares || []}
              ownerId={project.ownerId}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ProjectDetailPage;
