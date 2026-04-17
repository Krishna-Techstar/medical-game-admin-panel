import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function ConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);

  const testConnection = async () => {
    setTesting(true);
    const testResults = {
      projectId: projectId || 'NOT SET',
      publicKey: publicAnonKey ? 'SET' : 'NOT SET',
      healthCheck: 'pending',
      cors: 'pending',
      timestamp: new Date().toISOString()
    };

    try {
      // Test 1: Health check endpoint
      console.log('Testing health endpoint...');
      const healthResponse = await fetch(
        `/make-server-2fad19e1/health`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (healthResponse.ok) {
        const data = await healthResponse.json();
        testResults.healthCheck = data.status === 'ok' ? 'passed' : 'failed';
        testResults.healthResponse = data;
      } else {
        testResults.healthCheck = 'failed';
        testResults.healthError = `Status: ${healthResponse.status}`;
      }
    } catch (error) {
      console.error('Health check error:', error);
      testResults.healthCheck = 'error';
      testResults.healthError = error.message;
    }

    // Test 2: CORS check
    try {
      console.log('Testing CORS...');
      const corsResponse = await fetch(
        `/make-server-2fad19e1/health`,
        {
          method: 'OPTIONS',
        }
      );

      testResults.cors = corsResponse.ok ? 'passed' : 'failed';
      testResults.corsStatus = corsResponse.status;
    } catch (error) {
      console.error('CORS check error:', error);
      testResults.cors = 'error';
      testResults.corsError = error.message;
    }

    setResults(testResults);
    setTesting(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            This tool tests your connection to the Supabase backend server.
          </p>
          <Button 
            onClick={testConnection} 
            disabled={testing}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              'Run Connection Test'
            )}
          </Button>
        </div>

        {results && (
          <div className="space-y-3 mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Test Results:</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-sm">Project ID</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {results.projectId.substring(0, 20)}...
                  </code>
                  {results.projectId !== 'NOT SET' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-sm">Public Anon Key</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs">{results.publicKey}</span>
                  {results.publicKey === 'SET' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-sm">Health Check Endpoint</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs capitalize">{results.healthCheck}</span>
                  {getStatusIcon(results.healthCheck)}
                </div>
              </div>
              {results.healthError && (
                <div className="ml-6 p-2 bg-red-50 text-red-700 text-xs rounded">
                  Error: {results.healthError}
                </div>
              )}

              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-sm">CORS Configuration</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs capitalize">{results.cors}</span>
                  {getStatusIcon(results.cors)}
                </div>
              </div>
              {results.corsError && (
                <div className="ml-6 p-2 bg-red-50 text-red-700 text-xs rounded">
                  Error: {results.corsError}
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded text-xs">
              <p className="font-semibold mb-1">Troubleshooting:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>If health check fails: Server may not be deployed</li>
                <li>If CORS fails: Check server CORS configuration</li>
                <li>If both fail: Check network connectivity</li>
                <li>Ensure you have clicked "Deploy" in the Figma Make interface</li>
              </ul>
            </div>

            <div className="text-xs text-muted-foreground">
              Test run at: {new Date(results.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
