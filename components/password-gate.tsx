'use client';

import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { joinGroupBySlug } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PasswordGate({ slug, name }: { slug: string; name: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await joinGroupBySlug(slug, password, displayName, email);
      if (result?.error) {
        setMessage(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Join {name}</CardTitle>
        <CardDescription>
          Enter the password and your details to join the group.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="password">Group Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Shared password"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          {message ? <p className="text-sm text-destructive">{message}</p> : null}
          <Button
            type="submit"
            className="w-full"
            disabled={pending || !password.trim() || !displayName.trim()}
          >
            {pending ? 'Joining...' : 'Join Group'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
