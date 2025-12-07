"use client";

import { useEffect, useState, useTransition } from "react";
import { Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteMember, getGroupMembers } from "@/app/actions";
import { type GroupMember } from "@/db/schema";

export function MembersDialog({ groupId, isAdmin }: { groupId: string, isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Pick<GroupMember, "id" | "displayName" | "isAdmin">[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setLoading(true);
      getGroupMembers(groupId).then((data) => {
        setMembers(data);
        setLoading(false);
      });
    }
  }, [open, groupId]);

  const handleRemoveMember = (memberId: string) => {
    startTransition(async () => {
      const result = await deleteMember(memberId);
      if (result?.success) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-2 text-slate-500 hover:text-slate-900">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Members</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Members</DialogTitle>
          <DialogDescription>
            {members.length} people in this group.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
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
                  {isAdmin && !member.isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-600"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={pending}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  )}
                </div>
              ))}
              {members.length === 0 && !loading && (
                 <p className="text-center text-sm text-muted-foreground">No members found.</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

