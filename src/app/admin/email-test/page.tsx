'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function EmailTestPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testEmail = async (action: string) => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          email,
          name: name || 'Test User'
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error',
        message: 'Failed to connect to the server'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-bold mb-6">Email Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@example.com"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Name (Optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Test User"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-4">
          <Button
            onClick={() => testEmail('test-connection')}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </Button>

          <Button
            onClick={() => testEmail('send-test')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Test Email'}
          </Button>

          <Button
            onClick={() => testEmail('send-welcome')}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Welcome Email'}
          </Button>
        </div>

        {result && (
          <div className={`p-4 rounded-md ${
            result.success 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <h3 className="font-semibold mb-2">Result:</h3>
            <p><strong>Status:</strong> {result.success ? 'Success' : 'Failed'}</p>
            <p><strong>Message:</strong> {result.message}</p>
            {result.action && <p><strong>Action:</strong> {result.action}</p>}
            {result.email && <p><strong>Email:</strong> {result.email}</p>}
            {result.error && <p><strong>Error:</strong> {result.error}</p>}
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-50 rounded-md">
          <h3 className="font-semibold mb-2">Zoho Email Configuration:</h3>
          <p className="text-sm text-gray-600 mb-2">
            Make sure you have set up the following environment variables in your .env file:
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li><code>EMAIL_PROVIDER=zoho</code></li>
            <li><code>ZOHO_EMAIL=your-email@zoho.com</code></li>
            <li><code>ZOHO_PASSWORD=your-zoho-app-password</code></li>
            <li><code>EMAIL_FROM=noreply@ditokens.com</code></li>
          </ul>
          <p className="text-sm text-gray-600 mt-2">
            <strong>Note:</strong> Use your Zoho App Password, not your regular Zoho password.
          </p>
        </div>
      </div>
    </div>
  );
}
