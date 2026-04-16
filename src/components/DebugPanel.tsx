import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { RefreshCw, Database, Users, AlertCircle } from 'lucide-react';

export function DebugPanel({ accessToken }) {
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDebugData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching debug data...');
      
      // Get all students from debug endpoint
      const response = await fetch(
        `/make-server-2fad19e1/debug/students`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      console.log('Debug response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch debug data: ${errorText}`);
      }

      const data = await response.json();
      console.log('Debug data received:', data);
      setDebugData(data);

      // Also try to get students via the normal endpoint
      const studentsResponse = await fetch(
        `/make-server-2fad19e1/teacher/all-students`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      console.log('Students endpoint status:', studentsResponse.status);
      const studentsData = await studentsResponse.json();
      console.log('Students endpoint data:', studentsData);

    } catch (err) {
      console.error('Debug fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-6 h-6" />
              <CardTitle>KV Store Debug Panel</CardTitle>
            </div>
            <Button
              onClick={fetchDebugData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {debugData && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-lg">
                    Total Students in KV Store: {debugData.count}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Students with prefix "student:" in the database
                </p>
              </div>

              {debugData.count === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">No Students Found</h3>
                  <p className="text-sm text-yellow-700 mb-3">
                    No student records were found in the KV store. This could mean:
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1 ml-4">
                    <li>• Students haven't registered yet</li>
                    <li>• Student signup is failing silently</li>
                    <li>• Data is being saved with a different key prefix</li>
                  </ul>
                  <div className="mt-4 p-3 bg-white rounded border border-yellow-300">
                    <p className="text-sm font-semibold mb-2">How to test:</p>
                    <ol className="text-sm space-y-1 ml-4">
                      <li>1. Open student portal in a new tab</li>
                      <li>2. Register a new student</li>
                      <li>3. Check browser console for logs</li>
                      <li>4. Come back here and click Refresh</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-semibold">Student Records:</h3>
                  {debugData.students.map((student, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-semibold">Key:</span>
                            <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                              {student.key}
                            </code>
                          </div>
                          <div>
                            <span className="font-semibold">ID:</span>
                            <span className="ml-2 text-muted-foreground">{student.id || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-semibold">Name:</span>
                            <span className="ml-2">{student.name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-semibold">Email:</span>
                            <span className="ml-2">{student.email || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-semibold">Role:</span>
                            <span className="ml-2">{student.role || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-semibold">Created:</span>
                            <span className="ml-2 text-muted-foreground">
                              {student.createdAt ? new Date(student.createdAt).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm font-semibold text-blue-600 hover:text-blue-700">
                            View Raw JSON
                          </summary>
                          <pre className="mt-2 bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(student, null, 2)}
                          </pre>
                        </details>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
