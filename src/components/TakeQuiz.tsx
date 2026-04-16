import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function TakeQuiz({ quiz, onBack, onSubmit }) {
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(quiz.duration * 60); // Convert to seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, timeRemaining]);

  const handleAutoSubmit = () => {
    toast.warning('Time is up! Submitting your quiz automatically...');
    setTimeout(() => {
      handleSubmit();
    }, 1000);
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers({
      ...answers,
      [questionId]: optionIndex
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    // Calculate score
    let correctAnswers = 0;
    quiz.questions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const totalQuestions = quiz.questions.length;
    const answeredQuestions = Object.keys(answers).length;
    const scorePercentage = (correctAnswers / totalQuestions) * 100;
    const pointsEarned = Math.round((correctAnswers / totalQuestions) * quiz.totalPoints);

    const submission = {
      quizId: quiz.id,
      answers: answers,
      correctAnswers: correctAnswers,
      totalQuestions: totalQuestions,
      answeredQuestions: answeredQuestions,
      unansweredQuestions: totalQuestions - answeredQuestions,
      scorePercentage: scorePercentage,
      pointsEarned: pointsEarned,
      totalPoints: quiz.totalPoints,
      timeSpent: quiz.duration * 60 - timeRemaining,
      submittedAt: new Date().toISOString()
    };

    onSubmit(submission);
    toast.success(`Quiz submitted! You scored ${pointsEarned}/${quiz.totalPoints} points`);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const percentage = (timeRemaining / (quiz.duration * 60)) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz.questions.length;

  if (!hasStarted) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            <p className="text-white/90 mt-2">{quiz.description}</p>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Duration</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{quiz.duration} min</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 text-purple-700 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">Total Points</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">{quiz.totalPoints}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Questions</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{totalQuestions}</p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 text-orange-700 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Due Date</span>
                </div>
                <p className="text-lg font-bold text-orange-900">
                  {new Date(quiz.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">Important Instructions:</h3>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li>• Once you start, the timer will begin and cannot be paused</li>
                <li>• All questions are multiple choice</li>
                <li>• You can change your answers before submitting</li>
                <li>• The quiz will auto-submit when time runs out</li>
                <li>• Make sure you have a stable internet connection</li>
              </ul>
            </div>

            <Button
              onClick={() => setHasStarted(true)}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-lg py-6"
            >
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Fixed Timer Header */}
      <div className="sticky top-0 z-10 mb-6 bg-white rounded-lg shadow-lg border-2 border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{quiz.title}</h2>
            <p className="text-sm text-muted-foreground">
              Progress: {answeredCount}/{totalQuestions} answered
            </p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getTimerColor()} flex items-center gap-2`}>
              <Clock className="w-8 h-8" />
              {formatTime(timeRemaining)}
            </div>
            <p className="text-sm text-muted-foreground">Time Remaining</p>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {quiz.questions.map((question, qIndex) => (
          <Card key={question.id} className="border-2 border-gray-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-indigo-500">Question {qIndex + 1}</Badge>
                    {answers[question.id] !== undefined && (
                      <Badge className="bg-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Answered
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{question.question}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {question.options.map((option, optIndex) => {
                  const isSelected = answers[question.id] === optIndex;
                  return (
                    <button
                      key={optIndex}
                      onClick={() => handleAnswerSelect(question.id, optIndex)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {String.fromCharCode(65 + optIndex)}
                        </div>
                        <span className={isSelected ? 'font-medium' : ''}>{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit Section */}
      <Card className="mt-6 border-2 border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Ready to submit?</h3>
              <p className="text-sm text-muted-foreground">
                You've answered {answeredCount} out of {totalQuestions} questions
                {answeredCount < totalQuestions && (
                  <span className="text-orange-600 font-medium">
                    {' '}({totalQuestions - answeredCount} unanswered)
                  </span>
                )}
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-6 text-lg"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
