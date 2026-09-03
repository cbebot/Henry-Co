/**
 * Follow-state machine: whether new content should auto-pin the pane to the
 * bottom, and how many messages arrived while the reader was scrolled up
 * (drives the "new messages" chip). Pure — the component feeds it scroll
 * geometry and arrival events.
 */

export const FOLLOW_THRESHOLD_PX = 120;

export function isNearBottom(
  scrollTop: number,
  clientHeight: number,
  scrollHeight: number,
  threshold: number = FOLLOW_THRESHOLD_PX,
): boolean {
  return scrollHeight - (scrollTop + clientHeight) <= threshold;
}

export type FollowState = { following: boolean; unseen: number };

export function initialFollow(): FollowState {
  return { following: true, unseen: 0 };
}

export function onScrollPosition(state: FollowState, near: boolean): FollowState {
  if (near) {
    if (state.following && state.unseen === 0) return state;
    return { following: true, unseen: 0 };
  }
  if (!state.following) return state;
  return { ...state, following: false };
}

/** Own sends always re-pin; other-party arrivals only count while scrolled up. */
export function onIncoming(state: FollowState, count: number, own: boolean): FollowState {
  if (own) {
    if (state.following && state.unseen === 0) return state;
    return { following: true, unseen: 0 };
  }
  if (state.following) return state;
  return { ...state, unseen: state.unseen + count };
}
