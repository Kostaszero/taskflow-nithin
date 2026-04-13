import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projects, tasks } from '../utils/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  tasks: Task[];
  assignable_users?: UserOption[];
}

interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  assignee_name: string;
  due_date: string;
}

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [taskAssigneeInputs, setTaskAssigneeInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter] = useState<{ status?: string }>({});
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({ title: '', description: '', priority: 'medium', assignee_name: '', due_date: '' });

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await projects.get(id!);
      setProject(response.data);
      setUserOptions(response.data.assignable_users || []);
      setTaskAssigneeInputs(
        Object.fromEntries(
          (response.data.tasks || []).map((task: Task) => [task.id, response.data.assignable_users?.find((userOption: UserOption) => userOption.id === task.assignee_id)?.name || ''])
        )
      );
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const resolveAssigneeId = (value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return null;
    }

    const match = userOptions.find((userOption: UserOption) => {
      const normalizedValue = trimmedValue.toLowerCase();
      return userOption.name.toLowerCase() === normalizedValue || userOption.email.toLowerCase() === normalizedValue;
    });

    return match?.id || null;
  };

  const getMatchingUsers = (query: string) => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [] as UserOption[];
    }

    return userOptions
      .filter((userOption: UserOption) =>
        userOption.name.toLowerCase().includes(normalizedQuery) ||
        userOption.email.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 4);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const assigneeId = resolveAssigneeId(formData.assignee_name);

      if (formData.assignee_name.trim() && !assigneeId) {
        setError('Assignee must match an existing user name or email.');
        return;
      }

      await tasks.create(
        id!,
        formData.title,
        formData.description,
        formData.priority,
        assigneeId || undefined,
        formData.due_date,
      );
      setFormData({ title: '', description: '', priority: 'medium', assignee_name: '', due_date: '' });
      setShowTaskForm(false);
      await loadProject();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create task');
    }
  };

  const handleAssignTask = async (taskId: string, assigneeId: string) => {
    try {
      await tasks.update(taskId, { assignee_id: assigneeId || null });
      await loadProject();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign task');
    }
  };

  const handleTaskAssigneeInputChange = (taskId: string, value: string) => {
    setTaskAssigneeInputs((current: Record<string, string>) => ({ ...current, [taskId]: value }));
  };

  const handleTaskAssigneeCommit = async (taskId: string, value: string, currentAssigneeId: string | null) => {
    const assigneeId = resolveAssigneeId(value);

    if (value.trim() && !assigneeId) {
      setError('Assignee must match an existing user name or email.');
      setTaskAssigneeInputs((current: Record<string, string>) => ({
        ...current,
        [taskId]: getAssigneeLabel(currentAssigneeId),
      }));
      return;
    }

    await handleAssignTask(taskId, assigneeId || '');
  };

  const formatDate = (value: string | null) => {
    if (!value) {
      return 'Not set';
    }

    return new Date(value).toLocaleDateString();
  };

  const getAssigneeLabel = (assigneeId: string | null) => {
    if (!assigneeId) {
      return 'Unassigned';
    }

    const match = userOptions.find((userOption: UserOption) => userOption.id === assigneeId);
    return match ? match.name : 'Assigned';
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

  const filteredTasks = project.tasks.filter((task: Task) => 
    !filter.status || task.status === filter.status
  );

  const tasksByStatus = {
    todo: filteredTasks.filter((task: Task) => task.status === 'todo'),
    in_progress: filteredTasks.filter((task: Task) => task.status === 'in_progress'),
    done: filteredTasks.filter((task: Task) => task.status === 'done'),
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Button onClick={() => navigate('/projects')} variant="ghost" className="mb-2 px-0">
            ← Back to Projects
          </Button>
          <h1 className="text-4xl font-semibold tracking-tight">{project.name}</h1>
          {project.description && <p className="text-slate-600 mt-2">{project.description}</p>}
        </div>
        <Button
          onClick={() => setShowTaskForm(true)}
          size="lg"
        >
          Create Task
        </Button>
      </div>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-600">{error}</div>}

      {showTaskForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create Task</CardTitle>
            <CardDescription>Add a new task to this project board.</CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleCreateTask} className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <Input
                type="text"
                placeholder="Task title"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((current: TaskFormData) => ({ ...current, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <Textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData((current: TaskFormData) => ({ ...current, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData((current: TaskFormData) => ({ ...current, priority: e.target.value as TaskFormData['priority'] }))}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Assignee</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.assignee_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((current: TaskFormData) => ({ ...current, assignee_name: e.target.value }))}
                    placeholder="Type a name"
                    list="taskflow-assignee-options"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData((current: TaskFormData) => ({ ...current, assignee_name: '' }))}
                  >
                    Clear
                  </Button>
                </div>
                {formData.assignee_name.trim() && (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
                    {getMatchingUsers(formData.assignee_name).length > 0
                      ? getMatchingUsers(formData.assignee_name).map((userOption: UserOption) => (
                          <p key={userOption.id}>
                            {userOption.name} ({userOption.email})
                          </p>
                        ))
                      : 'No matching users'}
                  </div>
                )}
                <p className="text-xs text-slate-500">Optional. Start typing to select user.</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Due Date</label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((current: TaskFormData) => ({ ...current, due_date: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Create</Button>
              <Button type="button" variant="secondary" onClick={() => setShowTaskForm(false)}>Cancel</Button>
            </div>
          </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['todo', 'in_progress', 'done'].map(status => (
          <Card key={status} className="bg-slate-50/80">
            <CardHeader className="pb-3">
            <h3 className="font-bold text-slate-700 capitalize">
              {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
            </h3>
            <CardDescription>{tasksByStatus[status as keyof typeof tasksByStatus].length} tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasksByStatus[status as keyof typeof tasksByStatus].map((task: Task) => (
                <div key={task.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <p className="font-medium text-sm">{task.title}</p>
                  {task.description && <p className="text-xs text-slate-600 mt-1">{task.description}</p>}
                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <p>Created: {formatDate(task.created_at)}</p>
                    <p>Updated: {formatDate(task.updated_at)}</p>
                    <p>Due: {formatDate(task.due_date)}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2">
                    <Badge className={`${
                      task.priority === 'high' ? 'bg-red-100 text-red-700' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {task.priority}
                    </Badge>
                    <Badge className="bg-slate-100 text-slate-700">
                      {getAssigneeLabel(task.assignee_id)}
                    </Badge>
                    </div>
                    <div className="flex gap-1 text-xs">
                      {status !== 'done' && (
                        <Button
                          onClick={() => handleUpdateTaskStatus(task.id, status === 'todo' ? 'in_progress' : 'done')}
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-blue-600 hover:text-blue-700"
                        >
                          ▶
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDeleteTask(task.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-red-600 hover:text-red-700"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={taskAssigneeInputs[task.id] || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTaskAssigneeInputChange(task.id, e.target.value)}
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => void handleTaskAssigneeCommit(task.id, e.target.value, task.assignee_id)}
                      placeholder="Assign by name"
                      list="taskflow-assignee-options"
                      className="h-9 text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={() => void handleAssignTask(task.id, '')}
                    >
                      Unassign
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <datalist id="taskflow-assignee-options">
        {userOptions.map((userOption: UserOption) => (
          <option key={userOption.id} value={userOption.name} label={userOption.email} />
        ))}
      </datalist>
    </div>
  );
};
