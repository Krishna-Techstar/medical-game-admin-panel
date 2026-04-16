import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/info';

const EDGE_URL = `/make-server-2fad19e1`;

export function AddDailyTask({ selectedClass, classes = [], students = [], onBack, onTaskCreated, accessToken }) {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(selectedClass?.id || '');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [rewardPoints, setRewardPoints] = useState('100');
  const [loading, setLoading] = useState(false);

  const activeClass = selectedClass || classes.find(c => c.id === selectedClassId) || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskTitle.trim() || !taskDescription.trim() || !dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!accessToken) {
      toast.error('Authentication error. Please log in again.');
      return;
    }

    setLoading(true);

    try {
      const pts = parseInt(rewardPoints) || 100;
      const taskPayload = {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        points: pts,
        date: dueDate,
        class_id: activeClass?.id || null,
        subject: activeClass?.name || 'General',
        priority: priority,
        type: 'task',
      };

      // Try the newer /teacher/add-task endpoint first, fall back to /teacher/tasks
      let response = await fetch(`${EDGE_URL}/teacher/add-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(taskPayload),
      });

      // If add-task doesn't exist on deployed version, fall back to /teacher/tasks
      if (response.status === 404) {
        response = await fetch(`${EDGE_URL}/teacher/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            id: `task-${Date.now()}`,
            title: taskPayload.title,
            description: taskPayload.description,
            maxPoints: pts,
            points: pts,
            dueDate: dueDate,
            date: dueDate,
            classId: activeClass?.id || null,
            className: activeClass?.name || null,
            subject: taskPayload.subject,
            priority: priority,
            type: 'task',
            status: 'active',
          }),
        });
      }

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Server error ${response.status}`);
      }

      const result = await response.json();
      const createdTask = result.task || result;

      const assignedCount = activeClass
        ? students.filter(s => s.classId === activeClass.id).length
        : students.length;

      const assignMsg = activeClass
        ? `Task created and assigned to ${assignedCount} student(s) in ${activeClass.name}!`
        : `Task created and assigned to ${assignedCount} student(s)!`;
      toast.success(assignMsg);

      if (onTaskCreated) onTaskCreated(createdTask);
      onBack();
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task: ' + (error.message || 'Unknown error'));
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button onClick={onBack} variant="ghost" className="gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-amber-500" />
          Add Task {activeClass && `— ${activeClass.name}`}
        </h1>

        <Alert className="mb-6 border-0 bg-gradient-to-r from-amber-50 to-pink-50 shadow-sm">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900 ml-2">
            {activeClass
              ? `This task will be automatically assigned to all students enrolled in ${activeClass.name}.`
              : 'This task will be assigned to all registered students.'}
          </AlertDescription>
        </Alert>

        <Card className="border-0 shadow-lg">
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-semibold">
                  Task Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Master Oral Pathology Case Studies"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-semibold">
                  Task Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what students need to accomplish..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={4}
                  className="text-base"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Class / Subject</Label>
                  {selectedClass ? (
                    <Input value={selectedClass.name} disabled className="text-base bg-slate-50" />
                  ) : (
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="All students (no specific class)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-base font-semibold">
                    Due Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-base font-semibold">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="points" className="text-base font-semibold">
                    Reward Points <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="points"
                    type="number"
                    min="10"
                    max="1000"
                    value={rewardPoints}
                    onChange={(e) => setRewardPoints(e.target.value)}
                    className="text-base"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2 justify-end">
                <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white border-0"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Task
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
