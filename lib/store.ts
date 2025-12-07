"use client";

import { Store } from "@tanstack/store";
import { useSyncExternalStore } from "react";

type PendingAction =
  | { type: "comment"; postId: string; text: string }
  | { type: "reaction"; postId: string; emoji: string }
  | null;

type UIState = {
  nameDialogOpen: boolean;
  newPostDialogOpen: boolean;
  pendingAction: PendingAction;
};

const uiStore = new Store<UIState>({
  nameDialogOpen: false,
  newPostDialogOpen: false,
  pendingAction: null,
});

export function setNameDialogOpen(
  open: boolean,
  pending: PendingAction = null
) {
  uiStore.setState((prev) => ({
    ...prev,
    nameDialogOpen: open,
    pendingAction: pending ?? prev.pendingAction,
  }));
}

export function setNewPostDialogOpen(open: boolean) {
  uiStore.setState((prev) => ({ ...prev, newPostDialogOpen: open }));
}

export function useUIState<T>(selector: (state: UIState) => T) {
  const state = useSyncExternalStore(
    (callback) => uiStore.subscribe(() => callback()),
    () => uiStore.state,
    () => uiStore.state
  );
  return selector(state);
}

export function getUIStateSnapshot() {
  return uiStore.state;
}
