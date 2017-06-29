// Simple polyfills for random browsers missing functions we need
window.requestAnimationFrame = window.requestAnimationFrame || function(cb) {
  setTimeout(cb, 0);
}

window.location.origin = window.location.origin || (
  window.location.protocol + "//" + window.location.hostname +
  (window.location.port ? ':' + window.location.port : ''));
