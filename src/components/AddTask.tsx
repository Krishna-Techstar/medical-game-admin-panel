import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Plus, Calendar, BookOpen, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function AddTask({ classData, onBack, onAddTask, students }) {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    subject: classData.subject || '',
    maxPoints: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!taskData.title || !taskData.description || !taskData.dueDate || !taskData.maxPoints) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newTask = {
      id: `task-${Date.now()}`,
      classId: classData.id,
      className: classData.name,
      ...taskData,
      maxPoints: parseInt(taskData.maxPoints),
      createdAt: new Date().toISOString(),
      status: 'active',
      type: 'task' // Mark as task (not quiz)
    };

    // Get all students enrolled in this class
    const enrolledStudents = students.filter(student => student.classId === classData.id);
    
    console.log('Assigning task to students in class:', classData.id);
    console.log('Enrolled students:', enrolledStudents.length);

    // Assign task to each student
    enrolledStudents.forEach(student => {
      const studentTasksKey = `student_tasks:${student.email}`;
      const existingTasks = JSON.parse(localStorage.getItem(studentTasksKey) || '[]');
      
      // Add the new task to student's task list
      const studentTask = {
        ...newTask,
        completed: false,
        started: false,
        submittedAt: null
      };
      
      existingTasks.push(studentTask);
      localStorage.setItem(studentTasksKey, JSON.stringify(existingTasks));
      
      console.log(`Assigned task to ${student.email}:`, studentTasksKey);
    });

    onAddTask(newTask);
    toast.success(`Quest "${taskData.title}" assigned to ${enrolledStudents.length} student(s) in ${classData.name}!`);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Button
        onClick={onBack}
        variant="ghost"
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Class
      </Button>

      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            Create Daily Quest for {classData.name}
          </CardTitle>
          <p className="text-sm text-white/90 mt-2">
            ✨ This quest will be assigned to all students in this class and appear on their dashboard
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Quest Title *
              </Label>
              <Input
                id="title"
                placeholder="e.g., Master Oral Pathology Case Studies"
                value={taskData.title}
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="description">Quest Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the quest and what students need to accomplish..."
                value={taskData.description}
                onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                className="mt-2 min-h-[120px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Subject name"
                  value={taskData.subject}
                  onChange={(e) => setTaskData({ ...taskData, subject: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="maxPoints" className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Reward Points *
                </Label>
                <Input
                  id="maxPoints"
                  type="number"
                  placeholder="100"
                  value={taskData.maxPoints}
                  onChange={(e) => setTaskData({ ...taskData, maxPoints: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  Due Date *
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={taskData.dueDate}
                  onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={taskData.priority}
                  onValueChange={(value) => setTaskData({ ...taskData, priority: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900">Quest Assignment</h4>
                  <p className="text-sm text-amber-800 mt-1">
                    This daily quest will be automatically assigned to all {classData.studentCount} student(s) currently enrolled in {classData.name}. It will appear as a highlighted quest card on their dashboard!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-600 hover:via-orange-600 hover:to-pink-600 text-white border-0 shadow-md"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create Quest
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}