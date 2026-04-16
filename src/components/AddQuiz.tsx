import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Plus, Clock, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function AddQuiz({ classData, onBack, onAddQuiz, students }) {
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    dueDate: '',
    duration: '30', // duration in minutes
    subject: classData.subject || '',
    totalPoints: '100'
  });

  const [questions, setQuestions] = useState([
    {
      id: 1,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    }
  ]);

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
    if (!quizData.title || !quizData.description || !quizData.dueDate || !quizData.duration) {
      toast.error('Please fill in all required fields');
      return;
    }

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

    const newQuiz = {
      id: `quiz-${Date.now()}`,
      classId: classData.id,
      className: classData.name,
      type: 'quiz',
      ...quizData,
      duration: parseInt(quizData.duration),
      totalPoints: parseInt(quizData.totalPoints),
      maxPoints: parseInt(quizData.totalPoints), // Add maxPoints for consistency
      questions: questions,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    // Get all students enrolled in this class
    const enrolledStudents = students.filter(student => student.classId === classData.id);
    
    console.log('Assigning quiz to students in class:', classData.id);
    console.log('Enrolled students:', enrolledStudents.length);

    // Assign quiz to each student
    enrolledStudents.forEach(student => {
      const studentTasksKey = `student_tasks:${student.email}`;
      const existingTasks = JSON.parse(localStorage.getItem(studentTasksKey) || '[]');
      
      // Add the new quiz to student's task list
      const studentQuiz = {
        ...newQuiz,
        completed: false,
        started: false,
        submittedAt: null
      };
      
      existingTasks.push(studentQuiz);
      localStorage.setItem(studentTasksKey, JSON.stringify(existingTasks));
      
      console.log(`Assigned quiz to ${student.email}:`, studentTasksKey);
    });

    onAddQuiz(newQuiz);
    toast.success(`Quiz "${quizData.title}" assigned to ${enrolledStudents.length} student(s) in ${classData.name}`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Button
        onClick={onBack}
        variant="ghost"
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Class
      </Button>

      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Quiz for {classData.name}
          </CardTitle>
          <p className="text-sm text-white/90 mt-2">
            Create a timed multiple-choice quiz for your students
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Quiz Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Oral Pathology - Chapter 1 Quiz"
                  value={quizData.title}
                  onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide instructions and details about the quiz..."
                  value={quizData.description}
                  onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                  className="mt-2 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Subject name"
                    value={quizData.subject}
                    onChange={(e) => setQuizData({ ...quizData, subject: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="30"
                    value={quizData.duration}
                    onChange={(e) => setQuizData({ ...quizData, duration: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="totalPoints">Total Points *</Label>
                  <Input
                    id="totalPoints"
                    type="number"
                    placeholder="100"
                    value={quizData.totalPoints}
                    onChange={(e) => setQuizData({ ...quizData, totalPoints: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={quizData.dueDate}
                  onChange={(e) => setQuizData({ ...quizData, dueDate: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Questions Section */}
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

            {/* Assignment Info */}
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-indigo-900">Quiz Assignment</h4>
                  <p className="text-sm text-indigo-700 mt-1">
                    This quiz will be automatically assigned to all {classData.studentCount} student(s) currently enrolled in {classData.name}.
                  </p>
                  <p className="text-sm text-indigo-700 mt-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Students will have {quizData.duration} minutes to complete the quiz.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Quiz
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