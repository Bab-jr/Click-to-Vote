import React from "react";
import { AlertCircle } from "lucide-react";

// Catches render-time crashes (e.g. unexpected API data shapes on the live
// server) and shows a friendly fallback instead of a blank white screen.
export default class ErrorBoundary extends React.Component {
  state = { hasError: false, message: "" };

  static getDerivedStateFromError(err) {
    return { hasError: true, message: err?.message || "Something went wrong." };
  }

  handleBack = () => {
    this.setState({ hasError: false, message: "" });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F9FAFB]">
          <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Something went wrong
            </h3>
            <p className="text-sm text-gray-500 mb-5 break-words">
              {this.state.message}
            </p>
            <button
              onClick={this.handleBack}
              className="px-4 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
            >
              Back to safety
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}