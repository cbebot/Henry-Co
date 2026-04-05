import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  children: ReactNode;
  onReset?: () => void;
  fallbackMessage?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error("ErrorBoundary caught:", error, info.componentStack);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const message =
      this.props.fallbackMessage ??
      "Something went wrong. Please try again.";

    return (
      <View className="flex-1 items-center justify-center bg-[#0B0B0C] px-6">
        <View className="w-full max-w-sm rounded-2xl border border-[#C9A227]/30 bg-[#141416] p-6">
          <View className="mb-4 h-1 w-12 self-center rounded-full bg-[#C9A227]" />

          <Text className="mb-2 text-center text-lg font-bold text-white">
            Oops
          </Text>

          <Text className="mb-4 text-center text-sm leading-5 text-[#B8B8C0]">
            {message}
          </Text>

          {__DEV__ && this.state.error && (
            <View className="mb-4 rounded-lg bg-[#1E1E22] p-3">
              <Text className="text-xs text-red-400" numberOfLines={4}>
                {this.state.error.message}
              </Text>
            </View>
          )}

          <Pressable
            onPress={this.handleReset}
            className="items-center rounded-xl bg-[#C9A227] px-6 py-3 active:opacity-80"
          >
            <Text className="text-sm font-bold text-[#0B0B0C]">
              Try Again
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }
}
