/**
 * @drawer/default — parallel-route slot for the ContextDrawer feed.
 *
 * V2-DASH-01 G7 ships an empty default. DASH-6 introduces the
 * realtime signal-feed renderer and replaces this default with a
 * server component that calls `getSignalFeed(viewer)` and streams
 * results into the ContextDrawer body.
 */
export default function DrawerDefault(): null {
  return null;
}
