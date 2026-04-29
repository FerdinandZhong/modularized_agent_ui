'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useWorkflowStore } from '@/stores/workflowStore';

export function ConnectForm() {
  const router = useRouter();
  const { connect, isConnecting, connectError } = useWorkflowStore();

  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lastWorkflowUrl');
      if (saved) setUrl(saved);
    }

    // Auto-connect if env vars are set (baked in via next.config.mjs for CAI deployments)
    const backendUrl = process.env.WORKFLOW_BACKEND_URL;
    const envApiKey = process.env.WORKFLOW_API_KEY;
    if (backendUrl && envApiKey) {
      handleConnectWith(backendUrl, envApiKey);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnectWith = async (targetUrl: string, targetKey: string) => {
    const ok = await connect(targetUrl, targetKey);
    if (ok) router.push('/workflow');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleConnectWith(url.trim(), apiKey.trim());
  };

  return (
    <Card variant="glass" className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          variant="dark"
          label="Workflow URL"
          placeholder="https://your-workflow.example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          autoComplete="url"
          required
        />
        <Input
          variant="dark"
          label="API Key"
          type="password"
          placeholder="Enter your API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          autoComplete="current-password"
          required
        />

        {connectError && (
          <div className="flex items-start gap-2.5 rounded-large bg-red-500/10 border border-red-500/20 px-4 py-3">
            <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-caption text-red-300">{connectError}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-1"
          disabled={isConnecting || !url.trim() || !apiKey.trim()}
        >
          {isConnecting ? 'Connecting…' : (
            <>
              Connect to Workflow
              <ArrowRight size={16} className="ml-2" />
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
