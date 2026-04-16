import React, { useState, useEffect } from 'react';
import { StudentLogin } from './components/StudentLogin';
import { StudentSignup } from './components/StudentSignup';
import { StudentDashboard } from './components/StudentDashboard';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { supabase } from './utils/supabase/client';
import { projectId, publicAnonKey } from './utils/supabase/info';

export function StudentApp({ onBackToLanding }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [showSignup, setShowSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && session.access_token) {
        // Check role from metadata first
        const userRole = session.user?.user_metadata?.role;
        console.log('Existing session found, user role:', userRole);

        // If there's a teacher in the student portal, sign them out
        if (userRole === 'teacher') {
          console.log('Teacher session detected in student portal - clearing session');
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        // Fetch student data from backend
        const response = await fetch(`/make-server-2fad19e1/student/profile`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentStudent(data.student);
          setAccessToken(session.access_token);
          setIsAuthenticated(true);
        } else {
          // If fetch fails, clear the session
          console.log('Failed to fetch student profile, clearing session');
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      console.log('Student attempting login for:', email, 'in student portal');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Student login error:', error);
        // Provide more helpful error message
        if (error.message === 'Invalid login credentials') {
          toast.error('Invalid email or password. Please check your credentials or sign up for a new account.');
        } else if (error.message.includes('fetch')) {
          toast.error('Connection error. Please check your internet connection and try again.');
        } else {
          toast.error(error.message);
        }
        throw error;
      }

      console.log('Student login successful, checking if user is a student...');

      if (data.session) {
        // Check the user's role from metadata
        const userRole = data.session.user?.user_metadata?.role;
        console.log('User role from metadata:', userRole);

        if (userRole === 'teacher') {
          console.log('Teacher trying to access student portal - rejecting');
          toast.error('This account is registered as a teacher. Please use the Admin Portal to login.');
          await supabase.auth.signOut();
          throw new Error('Wrong portal');
        }

        // Fetch student data from backend
        try {
          const response = await fetch(`/make-server-2fad19e1/student/profile`, {
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setCurrentStudent(userData.student);
            setAccessToken(data.session.access_token);
            setIsAuthenticated(true);
            toast.success(`Welcome back, ${userData.student.name}!`);
          } else {
            let errorMessage = 'Failed to fetch student data';
            try {
              const errorData = await response.json();
              console.log('Backend response error:', errorData);
              errorMessage = errorData.error || errorMessage;
            } catch {
              const text = await response.text().catch(() => '');
              console.log('Backend non-JSON error response:', response.status, text.slice(0, 200));
            }

            if (response.status === 403) {
              toast.error('Access denied. This account is not registered as a student. Please use the Admin Portal.');
              await supabase.auth.signOut();
            } else {
              toast.error(errorMessage);
            }
            await supabase.auth.signOut();
            throw new Error(errorMessage);
          }
        } catch (fetchError) {
          console.error('Fetch error:', fetchError);
          if (!fetchError.message.includes('Access denied') && !fetchError.message.includes('Failed to fetch')) {
            // already shown above
          } else if (fetchError.message.includes('Failed to fetch')) {
            toast.error('Unable to connect to the server. Please check your internet connection.');
          }
          await supabase.auth.signOut();
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleSignup = async (formData) => {
    try {
      const response = await fetch(`/make-server-2fad19e1/student/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          ...formData,
          role: 'student'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Signup failed');
        throw new Error(data.error);
      }

      toast.success('Account created successfully! Please sign in.');
      setShowSignup(false);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentStudent(null);
      setAccessToken(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
      
      // Go back to landing page after logout
      if (onBackToLanding) {
        setTimeout(() => {
          onBackToLanding();
        }, 500);
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const handleSwitchToAdmin = () => {
    // Go back to landing page
    if (onBackToLanding) {
      onBackToLanding();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showSignup) {
      return (
        <>
          <StudentSignup 
            onSignup={handleSignup}
            onSwitchToLogin={() => setShowSignup(false)}
            onBack={onBackToLanding}
          />
          <Toaster />
        </>
      );
    }
    return (
      <>
        <StudentLogin 
          onLogin={handleLogin}
          onSwitchToSignup={() => setShowSignup(true)}
          onSwitchToAdmin={handleSwitchToAdmin}
        />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <StudentDashboard 
        student={currentStudent} 
        onLogout={handleLogout}
        accessToken={accessToken}
        projectId={projectId}
      />
      <Toaster />
    </>
  );
}