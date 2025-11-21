import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SubscriberStats {
    subscribed: number;
    unsubscribed: number;
    total: number;
}

export const AdminNewsletter: React.FC = () => {
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [stats, setStats] = useState<SubscriberStats>({ subscribed: 0, unsubscribed: 0, total: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoadingStats(true);

            // Get count of subscribed users
            const { count: subscribedCount, error: subError } = await supabase
                .from('newsletter_subscribers' as any)
                .select('*', { count: 'exact', head: true })
                .eq('status', 'subscribed');

            if (subError) throw subError;

            // Get count of unsubscribed users
            const { count: unsubscribedCount, error: unsubError } = await supabase
                .from('newsletter_subscribers' as any)
                .select('*', { count: 'exact', head: true })
                .eq('status', 'unsubscribed');

            if (unsubError) throw unsubError;

            setStats({
                subscribed: subscribedCount || 0,
                unsubscribed: unsubscribedCount || 0,
                total: (subscribedCount || 0) + (unsubscribedCount || 0),
            });
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleTestNewsletter = async () => {
        if (!subject.trim() || !content.trim()) {
            setTestStatus('error');
            setTestMessage('Please fill in both subject and content before testing.');
            return;
        }

        setTestStatus('sending');
        setTestMessage('');

        try {
            // Get current session to ensure we're authenticated
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('Not authenticated. Please log in again.');
            }

            const { data, error } = await supabase.functions.invoke('newsletter/test', {
                body: { subject, content },
            });

            if (error) {
                console.error('Edge Function error:', error);
                console.error('Error details:', JSON.stringify(error, null, 2));

                // Try to extract the actual error message
                const errorMessage = error.context?.error
                    || error.message
                    || (typeof error === 'object' ? JSON.stringify(error) : String(error));

                throw new Error(errorMessage);
            }

            setTestStatus('success');
            setTestMessage(data.message || 'Test newsletter sent to montys@mit.edu! Check your inbox.');
        } catch (err: any) {
            console.error('Test newsletter error:', err);
            setTestStatus('error');
            setTestMessage(`Error: ${err.message || 'Failed to send test newsletter.'}`);
        }
    };

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm('Are you sure you want to send this to ALL subscribers?')) return;

        setStatus('sending');
        setMessage('');

        try {
            // Get current session to ensure we're authenticated
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('Not authenticated. Please log in again.');
            }

            const { data, error } = await supabase.functions.invoke('newsletter/broadcast', {
                body: { subject, content },
            });

            if (error) {
                console.error('Edge Function error:', error);
                throw new Error(error.message || JSON.stringify(error));
            }

            setStatus('success');
            setMessage(data.message || 'Newsletter sent successfully!');
            setSubject('');
            setContent('');
        } catch (err: any) {
            console.error('Broadcast error:', err);
            setStatus('error');
            setMessage(`Error: ${err.message || 'Failed to send newsletter.'}`);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Newsletter Broadcast</h1>

            {/* Subscriber Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-green-600">Active Subscribers</div>
                    <div className="mt-2 text-3xl font-bold text-green-900">
                        {loadingStats ? '...' : stats.subscribed}
                    </div>
                    <div className="mt-1 text-xs text-green-600">Will receive broadcasts</div>
                </div>

                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-red-600">Unsubscribed</div>
                    <div className="mt-2 text-3xl font-bold text-red-900">
                        {loadingStats ? '...' : stats.unsubscribed}
                    </div>
                    <div className="mt-1 text-xs text-red-600">Opted out of emails</div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-600">Total Users</div>
                    <div className="mt-2 text-3xl font-bold text-blue-900">
                        {loadingStats ? '...' : stats.total}
                    </div>
                    <div className="mt-1 text-xs text-blue-600">All newsletter records</div>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <form onSubmit={handleBroadcast} className="space-y-6">
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                            Subject Line
                        </label>
                        <input
                            type="text"
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="e.g., Monthly Update: New Features!"
                        />
                    </div>

                    <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                            Email Content (HTML supported)
                        </label>
                        <div className="mt-1">
                            <textarea
                                id="content"
                                rows={10}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md font-mono"
                                placeholder="<h1>Hello!</h1><p>Write your newsletter content here...</p>"
                            />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            Basic HTML is supported. An unsubscribe link will be automatically appended.
                        </p>
                    </div>

                    {testStatus === 'error' && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Test Error</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>{testMessage}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {testStatus === 'success' && (
                        <div className="rounded-md bg-blue-50 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">Test Sent</h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <p>{testMessage}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>{message}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="rounded-md bg-green-50 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-green-800">Success</h3>
                                    <div className="mt-2 text-sm text-green-700">
                                        <p>{message}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <button
                            type="button"
                            onClick={handleTestNewsletter}
                            disabled={testStatus === 'sending' || !subject.trim() || !content.trim()}
                            className="inline-flex justify-center py-2 px-4 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {testStatus === 'sending' ? 'Sending Test...' : '📧 Send Test (2 recipients)'}
                        </button>
                        <button
                            type="submit"
                            disabled={status === 'sending'}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {status === 'sending' ? 'Sending...' : 'Send Broadcast'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
