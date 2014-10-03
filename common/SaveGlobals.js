function esperSaveGlobals(names) {
  var state = {};
  for (var k in names) {
    var name = names[k];
    var v = window[name];
    if (v !== undefined) {
      state[name] = v;
      window[name] = undefined;
    }
  }

  function restoreGlobals() {
    for (var k in names) {
      var name = names[k];
      window[name] = state[name];
    }
  }
  return restoreGlobals;
}

/*
  Save global variables that are about to be overridden by the Esper extension.
*/
var esperRestoreGlobals = esperSaveGlobals([
  "$", "jQuery", "CryptoJS"
]);
