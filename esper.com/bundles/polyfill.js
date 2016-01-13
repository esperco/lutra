// Simple polyfills for random browsers missing functions we need
window.requestAnimationFrame = window.requestAnimationFrame || function(cb) {
  setTimeout(cb, 0);
}
