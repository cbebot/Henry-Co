export type TourStep = {
  id: string;
  title: string;
  body: string;
  /** CSS selector for the target element to highlight. If null, shows a centered modal. */
  target?: string | null;
  /** Route to navigate to before showing this step */
  route?: string | null;
  /** Position of tooltip relative to target */
  placement?: "top" | "bottom" | "left" | "right" | "center";
  /** Optional action label (e.g. "Try it", "Open this") */
  actionLabel?: string | null;
  /** Optional action href */
  actionHref?: string | null;
};

export type TourMachine = {
  id: string;
  version: number;
  name: string;
  description: string;
  steps: TourStep[];
};

export type TourProgress = {
  machineId: string;
  version: number;
  currentStep: number;
  completed: boolean;
  skipped: boolean;
  startedAt: string;
  completedAt?: string | null;
};

export type TourScope = "public" | "owner" | "manager" | "support" | "rider" | "staff";

const STORAGE_PREFIX = "henryco_care_tour_";

export function getTourStorageKey(scope: TourScope) {
  return `${STORAGE_PREFIX}${scope}`;
}

export function loadTourProgress(scope: TourScope): TourProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getTourStorageKey(scope));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveTourProgress(scope: TourScope, progress: TourProgress) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getTourStorageKey(scope), JSON.stringify(progress));
  } catch {
    // silent
  }
}

export function clearTourProgress(scope: TourScope) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(getTourStorageKey(scope));
  } catch {
    // silent
  }
}

export function hasSeenTour(scope: TourScope, version: number): boolean {
  const progress = loadTourProgress(scope);
  if (!progress) return false;
  return progress.version >= version && (progress.completed || progress.skipped);
}
