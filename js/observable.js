var observable = function () {
  var mod = {};

  function Observable() {
    var listeners = {};
    this.observe = function(key, fn) {
      listeners[key] = fn;
    };
    this.stopObserve = function(key) {
      delete listeners[key];
    };
    this.notify = function(v,w,x,y,z) {
      for (var key in listeners) {
        listeners[key](v,w,x,y,z);
      }
    };
  }

  mod.onTaskCreated = new Observable();
  mod.onTaskModified = new Observable();
  mod.onTaskParticipantsChanged = new Observable();
  mod.onTaskRankedBefore = new Observable();
  mod.onTaskRankedAfter = new Observable();
  mod.onTaskRankedFirst = new Observable();
  mod.onTaskRankedLast = new Observable();
  mod.onTaskArchived = new Observable();
  mod.onChatPosting = new Observable();
  mod.onChatPosted = new Observable();
  mod.onSchedulingStepChanging = new Observable();

  return mod;
}();
