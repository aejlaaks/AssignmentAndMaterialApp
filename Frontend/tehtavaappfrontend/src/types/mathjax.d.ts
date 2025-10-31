// MathJax module declaration
declare module 'mathjax/es5/tex-svg' {
  // The module doesn't export anything specific, it just loads MathJax
  const _default: any;
  export default _default;
}

// Global MathJax declaration
interface Window {
  MathJax?: any;
} 