import { Component } from 'react';

/* If WebGL is unavailable or the 3D scene throws, fall back to a static
   gradient backdrop so the rest of the site keeps working. */
export default class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) { console.warn('[Scene] disabled:', err?.message || err); }

  render() {
    if (this.state.failed) {
      return <div id="webgl" aria-hidden="true" className="webgl-fallback" />;
    }
    return this.props.children;
  }
}
