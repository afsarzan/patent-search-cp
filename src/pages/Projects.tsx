import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Folder, Plus, Share2, Archive, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import { Project } from '@/types/projects';
import { NewProjectModal } from '@/components/projects/NewProjectModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const ProjectsPage = () => {
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data: projectsData, isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete project');
      return res.json();
    },
    onSuccess: () => {
      refetch();
    },
  });

  const archiveProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const res = await fetch(`/api/projects/${projectId}/archive`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to archive project');
      return res.json();
    },
    onSuccess: () => {
      refetch();
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12">Loading projects...</div>;
  }

  const projects = projectsData?.projects || [];
  const hasProjects = projects.length > 0;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">My Projects</h1>
          <p className="text-muted-foreground mt-2">
            Organize and collaborate on patent research
          </p>
        </div>
        <Button
          onClick={() => setShowNewProjectModal(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {!hasProjects ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No projects yet</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Create your first project to start organizing your patent research and collaborate with teammates.
            </p>
            <Button onClick={() => setShowNewProjectModal(true)}>
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: Project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {project.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a href={`/projects/${project.id}`}>View Project</a>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => archiveProjectMutation.mutate(project.id)}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteProjectMutation.mutate(project.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {project.searchCount !== undefined && (
                      <Badge variant="secondary">
                        {project.searchCount} search{project.searchCount !== 1 ? 'es' : ''}
                      </Badge>
                    )}
                    {project.pinnedCount !== undefined && (
                      <Badge variant="secondary">
                        {project.pinnedCount} patent{project.pinnedCount !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {project.teamSize !== undefined && (
                      <Badge variant="secondary">
                        {project.teamSize} collaborator{project.teamSize !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </div>

                  <Button
                    asChild
                    className="w-full"
                    variant="outline"
                  >
                    <a href={`/projects/${project.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onSuccess={() => {
            setShowNewProjectModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
