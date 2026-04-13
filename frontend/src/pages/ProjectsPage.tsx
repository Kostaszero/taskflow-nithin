import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projects } from '../utils/api';

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export const ProjectsPage: React.FC = () => {
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projects.list();
      setProjectsList(response.data.projects || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await projects.create(formData.name, formData.description);
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
      await loadProjects();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await projects.delete(id);
      await loadProjects();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete project');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading projects...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          New Project
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>}

      {showCreateForm && (
        <div className="bg-slate-100 p-4 rounded mb-6">
          <h2 className="font-bold mb-4">Create Project</h2>
          <form onSubmit={handleCreateProject} className="space-y-3">
            <input
              type="text"
              placeholder="Project name"
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded"
            />
            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-slate-300 text-slate-700 px-4 py-2 rounded hover:bg-slate-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {projectsList.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded">
          <p className="text-slate-500 mb-4">No projects yet</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectsList.map(project => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-lg transition no-underline"
            >
              <h3 className="font-bold text-lg text-slate-900 mb-2">{project.name}</h3>
              {project.description && (
                <p className="text-slate-600 text-sm mb-4">{project.description}</p>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteProject(project.id);
                }}
                className="text-red-600 text-sm hover:text-red-700"
              >
                Delete
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
