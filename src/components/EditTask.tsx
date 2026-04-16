import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Save, Plus, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function EditTask({ task, onBack, onSave }) {
  const isQuiz = task.type === 'quiz';
  
  const [taskData, setTaskData] = useState({
    title: task.title || '',
    description: task.description || '',
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    priority: task.priority || 'medium',
    subject: task.subject || '',
    totalPoints: task.totalPoints || task.maxPoints || '100',
    duration: task.duration || '30',
    status: task.status || 'active'
  });

  const [questions, setQuestions] = useState(
    task.questions || []
  );

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: questions.length + 1,
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0
      }
    ]);
  };

  const handleRemoveQuestion = (questionId) => {
    if (questions.length === 1) {
      toast.error('Quiz must have at least one question');
      return;
    }
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const handleQuestionChange = (questionId, field, value) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const handleOptionChange = (questionId, optionIndex, value) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: q.options.map((opt, idx) => idx === optionIndex ? value : opt) }
        : q
    ));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!taskData.title || !taskData.description || !taskData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (isQuiz) {
      // Validate questions
      for (const question of questions) {
        if (!question.question.trim()) {
          toast.error('All questions must have text');
          return;
        }
        for (const option of question.options) {
          if (!option.trim()) {
            toast.error('All answer options must be filled');
            return;
          }
        }
      }
    }

    const updatedTask = {
      ...task,
      ...taskData,
      totalPoints: parseInt(taskData.totalPoints),
      duration: isQuiz ? parseInt(taskData.duration) : undefined,
      questions: isQuiz ? questions : undefined,
      updatedAt: new Date().toISOString()
    };

    onSave(updatedTask);
    toast.success(`${isQuiz ? 'Quiz' : 'Task'} updated successfully`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Button
        onClick={onBack}
        variant="ghost"
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            Edit {isQuiz ? 'Quiz' : 'Task'}: {task.title}
          </CardTitle>
          <p className="text-sm text-white/90 mt-2">
            Update the details of this {isQuiz ? 'quiz' : 'task'}
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">{isQuiz ? 'Quiz' : 'Task'} Title *</Label>
                <Input
                  id="title"
                  placeholder={`e.g., ${isQuiz ? 'Oral Pathology - Chapter 1 Quiz' : 'Complete Lab Report'}`}
                  value={taskData.title}
                  onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide instructions and details..."
                  value={taskData.description}
                  onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                  className="mt-2 min-h-[100px]"
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
                  <Label htmlFor="priority">Priority *</Label>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={taskData.dueDate}
                    onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                    className="mt-2"
                  />
                </div>

                {isQuiz && (
                  <div>
                    <Label htmlFor="duration">Duration (minutes) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="30"
                      value={taskData.duration}
                      onChange={(e) => setTaskData({ ...taskData, duration: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="totalPoints">Total Points *</Label>
                  <Input
                    id="totalPoints"
                    type="number"
                    placeholder="100"
                    value={taskData.totalPoints}
                    onChange={(e) => setTaskData({ ...taskData, totalPoints: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={taskData.status}
                    onValueChange={(value) => setTaskData({ ...taskData, status: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Questions Section for Quiz */}
            {isQuiz && (
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
                  <Button
                    type="button"
                    onClick={handleAddQuestion}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                <div className="space-y-6">
                  {questions.map((question, qIndex) => (
                    <Card key={question.id} className="border-2 border-gray-200">
                      <CardHeader className="bg-gray-50 pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Question {qIndex + 1}</CardTitle>
                          {questions.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveQuestion(question.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div>
                          <Label>Question Text *</Label>
                          <Textarea
                            placeholder="Enter your question here..."
                            value={question.question}
                            onChange={(e) => handleQuestionChange(question.id, 'question', e.target.value)}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label>Answer Options *</Label>
                          <div className="space-y-2 mt-2">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-sm">
                                  {String.fromCharCode(65 + optIndex)}
                                </div>
                                <Input
                                  placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                  value={option}
                                  onChange={(e) => handleOptionChange(question.id, optIndex, e.target.value)}
                                  className={question.correctAnswer === optIndex ? 'border-green-500 border-2' : ''}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label>Correct Answer *</Label>
                          <Select
                            value={question.correctAnswer.toString()}
                            onValueChange={(value) => handleQuestionChange(question.id, 'correctAnswer', parseInt(value))}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select correct answer" />
                            </SelectTrigger>
                            <SelectContent>
                              {question.options.map((option, idx) => (
                                <SelectItem key={idx} value={idx.toString()}>
                                  Option {String.fromCharCode(65 + idx)} {option && `- ${option.substring(0, 30)}${option.length > 30 ? '...' : ''}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Update Information</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Changes will be immediately reflected for all students. Students who have already submitted will not be affected.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-md"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
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
