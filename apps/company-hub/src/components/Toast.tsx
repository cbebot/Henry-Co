import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error" | "info";

type ToastEntry = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const BORDER_COLORS: Record<ToastType, string> = {
  success: "#C9A227",
  error: "#EF4444",
  info: "#3B82F6",
};

const ICON_LABELS: Record<ToastType, string> = {
  success: "\u2713",
  error: "\u2717",
  info: "\u2139",
};

function ToastItem({
  entry,
  onDone,
  topInset,
}: {
  entry: ToastEntry;
  onDone: (id: number) => void;
  topInset: number;
}) {
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  const dismiss = useCallback(() => {
    onDone(entry.id);
  }, [entry.id, onDone]);

  useState(() => {
    translateY.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(1, { duration: 300 });

    translateY.value = withDelay(
      2800,
      withTiming(-80, { duration: 300 }, (finished) => {
        if (finished) runOnJS(dismiss)();
      }),
    );
    opacity.value = withDelay(2800, withTiming(0, { duration: 300 }));
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const borderColor = BORDER_COLORS[entry.type];

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: topInset + 8,
          left: 16,
          right: 16,
          zIndex: 9999,
        },
        animatedStyle,
      ]}
    >
      <View
        className="flex-row items-center gap-3 rounded-xl bg-[#141416] px-4 py-3"
        style={{
          borderWidth: 1,
          borderColor,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <View
          className="h-6 w-6 items-center justify-center rounded-full"
          style={{ backgroundColor: borderColor + "20" }}
        >
          <Text style={{ color: borderColor, fontSize: 12, fontWeight: "700" }}>
            {ICON_LABELS[entry.type]}
          </Text>
        </View>
        <Text className="min-w-0 flex-1 text-sm font-medium text-white" numberOfLines={2}>
          {entry.message}
        </Text>
      </View>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(0);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((entry) => (
        <ToastItem
          key={entry.id}
          entry={entry}
          onDone={removeToast}
          topInset={insets.top}
        />
      ))}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
