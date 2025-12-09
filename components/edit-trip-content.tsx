"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateGroup, deleteMember } from "@/app/actions";
import { Group, GroupMember } from "@/db/schema";

export function EditTripContent({
  group,
  initialMembers,
}: {
  group: Group;
  initialMembers: Pick<GroupMember, "id" | "displayName" | "isAdmin">[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Group Settings State
  const [name, setName] = useState(group.name);
  const [slug, setSlug] = useState(group.slug);
  const [enablePassword, setEnablePassword] = useState(!!group.passwordHash);
  const [password, setPassword] = useState("");

  // Members State
  const [members, setMembers] = useState(initialMembers);

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await updateGroup(
        group.id,
        name,
        slug,
        enablePassword,
        password || undefined
      );
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Trip updated successfully");
        if (slug !== group.slug) {
          router.push(`/g/${slug}/edit`);
        }
        router.refresh();
      }
    });
  };

  const handleRemoveMember = (memberId: string) => {
    startTransition(async () => {
      const result = await deleteMember(memberId);
      if (result?.error) {
        setError(result.error);
      } else {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        setSuccess("Member removed and session invalidated");
      }
    });
  };

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 text-green-700 bg-green-50">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Trip Details</CardTitle>
          <CardDescription>
            Update the basic information for your trip.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateGroup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Trip Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Trip"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Trip URL (Slug)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  trippi.lat/g/
                </span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="my-trip"
                  required
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enablePassword"
                  checked={enablePassword}
                  onChange={(e) => setEnablePassword(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <Label htmlFor="enablePassword">Password Protection</Label>
              </div>

              {enablePassword && (
                <div className="pl-6 space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      group.passwordHash
                        ? "Leave empty to keep current"
                        : "Enter password"
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {group.passwordHash
                      ? "Only enter if you want to change the password."
                      : "Required to enable protection."}
                  </p>
                </div>
              )}
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Manage who has access to this trip.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 rounded-lg border bg-slate-50/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-700">
                    {member.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none text-slate-900">
                      {member.displayName}
                    </p>
                    {member.isAdmin && (
                      <p className="text-[10px] uppercase tracking-wider text-blue-600 mt-0.5">
                        Admin
                      </p>
                    )}
                  </div>
                </div>
                {!member.isAdmin && (
                  <div className="flex gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Remove Member"
                          className="h-8 w-8 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove "
                            {member.displayName}"? This will also invalidate
                            their session immediately.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel asChild>
                            <Button variant="outline">Cancel</Button>
                          </AlertDialogCancel>
                          <AlertDialogAction asChild>
                            <Button
                              variant="destructive"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              Remove
                            </Button>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                No members found.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
