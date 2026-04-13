import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projects, tasks } from '../utils/api';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  tasks: Task[];
}

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{ status?: string }>({});
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium', due_date: '' });

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await projects.get(id!);
      setProject(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tasks.create(id!, formData.title, formData.description, formData.priority, undefined, formData.due_date);
      setFormData({ title: '', description: '', priority: 'medium', due_date: '' });
      setShowTaskForm(false);
      await loadProject();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create task');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await tasks.update(taskId, { status: newStatus });
      await loadProject();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasks.delete(taskId);
      await loadProject();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete task');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading project...</div>;
  if (!project) return <div className="p-8 text-center">Project not found</div>;

  const filteredTasks = project.tasks.filter(task => 
    !filter.status || task.status === filter.status
  );

  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    done: filteredTasks.filter(t => t.status === 'done'),
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={() => navigate('/projects')} className="text-blue-600 hover:text-blue-700 mb-2">
            ← Back to Projects
          </button>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          {project.description && <p className="text-slate-600 mt-2">{project.description}</p>}
        </div>
        <button
          onClick={() => setShowTaskForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          New Task
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>}

      {showTaskForm && (
        <div className="bg-slate-100 p-4 rounded mb-6">
          <h2 className="font-bold mb-4">Create Task</h2>
          <form onSubmit={handleCreateTask} className="space-y-3">
            <input
              type="text"
              placeholder="Task title"
              value={formData.title}
              onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded"
            />
            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded"
              rows={2}
            />
            <select
              value={formData.priority}
              onChange={(e) => setFormData(p => ({ ...p, priority: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(p => ({ ...p, due_date: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded"
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
                onClick={() => setShowTaskForm(false)}
                className="bg-slate-300 text-slate-700 px-4 py-2 rounded hover:bg-slate-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['todo', 'in_progress', 'done'].map(status => (
          <div key={status} className="bg-slate-100 rounded-lg p-4">
            <h3 className="font-bold mb-4 text-slate-700 capitalize">
              {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
            </h3>
            <div className="space-y-2">
              {tasksByStatus[status as keyof typeof tasksByStatus].map(task => (
                <div key={task.id} className="bg-white border border-slate-300 rounded p-3">
                  <p className="font-medium text-sm">{task.title}</p>
                  {task.description && <p className="text-xs text-slate-600 mt-1">{task.description}</p>}
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      task.priority === 'high' ? 'bg-red-100 text-red-700' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {task.priority}
                    </span>
                    <menu className="flex gap-1 text-xs">
                      {status !== 'done' && (
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, status === 'todo' ? 'in_progress' : 'done')}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          ▶
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </menu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
