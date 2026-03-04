import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "2rem", fontFamily: "system-ui", color: "#eee", background: "#1a1a2e", minHeight: "100vh" }}>
          <h1 style={{ color: "#e74c3c" }}>Erreur</h1>
          <pre style={{ overflow: "auto", background: "#16213e", padding: "1rem", borderRadius: "8px" }}>
            {this.state.error.message}
          </pre>
          <pre style={{ fontSize: "0.85rem", color: "#888" }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
