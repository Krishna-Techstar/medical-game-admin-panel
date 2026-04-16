import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentApp } from './StudentApp';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { supabase } from './utils/supabase/client';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { GraduationCap, Users, ArrowRight } from 'lucide-react';

export default function App() {
  const [portalMode, setPortalMode] = useState(null); // null = landing, 'admin', 'student'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSignup, setShowSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);

  // Check for existing session on mount
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

        // If there's a student in the admin portal, sign them out
        if (userRole === 'student') {
          console.log('Student session detected in admin portal - clearing session');
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        // Try to fetch teacher data
        const teacherResponse = await fetch(`/make-server-2fad19e1/teacher/profile`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (teacherResponse.ok) {
          const data = await teacherResponse.json();
          setCurrentUser(data.teacher);
          setAccessToken(session.access_token);
          setIsAuthenticated(true);
          setPortalMode('admin');
        } else {
          // If fetch fails, clear the session
          console.log('Failed to fetch teacher profile, clearing session');
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
      console.log('Attempting login for:', email, 'in admin portal');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
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

      console.log('Login successful, checking if user is a teacher...');

      if (data.session) {
        // Check the user's role from metadata
        const userRole = data.session.user?.user_metadata?.role;
        console.log('User role from metadata:', userRole);

        if (userRole === 'student') {
          console.log('Student trying to access admin portal - rejecting');
          toast.error('This account is registered as a student. Please use the Student Portal to login.');
          await supabase.auth.signOut();
          throw new Error('Wrong portal');
        }

        // Fetch user data from backend
        try {
          const response = await fetch(`/make-server-2fad19e1/teacher/profile`, {
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData.teacher);
            setAccessToken(data.session.access_token);
            setIsAuthenticated(true);
            toast.success(`Welcome back, ${userData.teacher.name}!`);
          } else {
            let errorMessage = 'Failed to fetch user data';
            try {
              const errorData = await response.json();
              console.log('Backend response error:', errorData);
              errorMessage = errorData.error || errorMessage;
            } catch {
              const text = await response.text().catch(() => '');
              console.log('Backend non-JSON error response:', response.status, text.slice(0, 200));
            }

            if (response.status === 403) {
              toast.error('Access denied. This account is not registered as a teacher. Please use the Student Portal.');
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
      const response = await fetch(`/make-server-2fad19e1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(formData)
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
      setCurrentUser(null);
      setAccessToken(null);
      setIsAuthenticated(false);
      setPortalMode(null); // Go back to landing page
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Landing page - choose portal
  if (!portalMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-lg rounded-full mb-6 shadow-2xl">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">Dental College Portal</h1>
            <p className="text-xl text-white/90">Choose your portal to continue</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Admin Portal Card */}
            <Card 
              className="border-0 shadow-2xl bg-white/95 backdrop-blur-lg hover:shadow-3xl transition-all cursor-pointer hover:-translate-y-1"
              onClick={() => setPortalMode('admin')}
            >
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 mx-auto">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Admin Portal</CardTitle>
                <CardDescription className="text-base">
                  For teachers and administrators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Manage student records
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Add and update marks
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Create assignments and tasks
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    Track student progress
                  </li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-lg">
                  Access Admin Portal
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Student Portal Card */}
            <Card 
              className="border-0 shadow-2xl bg-white/95 backdrop-blur-lg hover:shadow-3xl transition-all cursor-pointer hover:-translate-y-1"
              onClick={() => setPortalMode('student')}
            >
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-4 mx-auto">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Student Portal</CardTitle>
                <CardDescription className="text-base">
                  For dental college students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    View grades and scores
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    Track experience points
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    View assigned tasks
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    Receive notifications
                  </li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-0 shadow-lg">
                  Access Student Portal
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Toaster />
      </div>
    );
  }

  // Student Portal
  if (portalMode === 'student') {
    return (
      <>
        <StudentApp onBackToLanding={() => setPortalMode(null)} />
        <Toaster />
      </>
    );
  }

  // Admin Portal
  if (!isAuthenticated) {
    if (showSignup) {
      return (
        <>
          <Signup 
            onSignup={handleSignup}
            onSwitchToLogin={() => setShowSignup(false)}
            onBack={() => { setShowSignup(false); setPortalMode(null); }}
          />
          <Toaster />
        </>
      );
    }
    return (
      <>
        <Login 
          onLogin={handleLogin}
          onSwitchToSignup={() => setShowSignup(true)}
          onBack={() => setPortalMode(null)}
        />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <AdminDashboard 
        currentUser={currentUser} 
        onLogout={handleLogout}
        accessToken={accessToken}
      />
      <Toaster />
    </>
  );
}