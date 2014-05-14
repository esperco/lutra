/*
  References = mutable boxes holding a value.

  Watchers can be registered and react when the value changes.
  Watchers become active only after initialization, i.e. they won't be called
  during the creation process.
*/

var ref = (function() {

  /* Global counter used to generate unique watcher IDs */
  var idCounter = 0;

  var locks = {};
  var lockTimeout = 1000; /* milliseconds */

  function createId() {
    idCounter++;
    return "" + idCounter;
  }

  /*
    Try to acquire a lock, returning true if successful.
    Locks expire after a while as a soft protection against
    various errors that would cause a lock to not be released.
  */
  function lock(id) {
    var d = locks[id];
    var now = new Date();
    if (d != null && now.getTime() <= d.getTime() + lockTimeout)
      return false;
    else {
      locks[id] = now;
      return true;
    }
  }

  function unlock(id) {
    delete locks[id];
  }

  /*
    Register a general-purpose handler, executed each time the data
    field is set.
    Return a watcher ID.
  */
  function watch(m, handler, optWatcherId) {
    var id = optWatcherId === undefined ? createId() : optWatcherId;
    m.changeHandlers.push({ handler: handler, id: id });
    return id;
  }

  /*
    Convenience function for registering a handler executed only
    when the data field goes from invalid to valid.
   */
  function watchTurnValid(m, simpleHandler) {
    function handler(newData, newValidity,
                     oldData, oldValidity) {
      if (newValidity && !oldValidity) {
        simpleHandler(newData, oldData);
      }
    }
    watch(m, handler);
  }

  /*
    Convenience function for registering a handler executed only
    when the data field goes from valid to invalid.
   */
  function watchTurnInvalid(m, simpleHandler) {
    function handler(newData, newValidity,
                     oldData, oldValidity) {
      if (!newValidity && oldValidity) {
        simpleHandler(newData, oldData);
      }
    }
    watch(m, handler);
  }

  function unwatch(m, watcherId) {
    m.changeHandlers = util.filter(m.changeHandlers, function(watcher) {
      return watcher.id !== watcherId;
    });
  }

  function unwatchAll(m) {
    m.changeHandlers = [];
  }

  function objectOfIdArray(a) {
    var obj = {};
    for (var i = 0; i < a.length; i++) {
      var k = a[i];
      obj[k] = true;
    }
    return obj;
  }

  /*
    Set a value.
    The lock prevents a value from being set twice during the same
    (synchronous) call.

    optBlockedWatchers is an optional list of watcher IDs that should
    be disabled.
  */
  function set(m, newData, optBlockedWatchers) {
    var id = m.id;
    var blockedWatchers =
      optBlockedWatchers === undefined ? {}
    : objectOfIdArray(optBlockedWatchers);
    if (lock(id)) {
      log("ref["+ id +"]: set value", newData);
      var oldValidity = m.validity;
      var oldData = m.data;
      var newValidity = m.isValid(newData);
      m.data = newData;
      m.validity = newValidity;

      var n = m.changeHandlers.length;
      for (var i = 0; i < n; i++) {
        var watcher = m.changeHandlers[i];
        var watcherId = watcher.id;
        if (blockedWatchers[watcherId] === undefined) {
          log("ref["+ id +"]: activate watcher " + watcherId);
          watcher.handler(newData, newValidity,
                          oldData, oldValidity);
        }
      }
      unlock(id);
    }
  }

  function updateValidity(m) {
    m.validity = m.isValid(m.data);
  }

  /*
    Get the data only if it is valid, otherwise return null.
    Avoids returning data with only some of the required fields.
   */
  function getValidOrNothing(m) {
    return m.validity ? m.data : null;
  }

  function isDefined(x) {
    return typeof x != "undefined";
  }

  /*
    Input:
    - isValid(data) : bool - decides whether the data is valid
    - initialData - initial data of any type; defaults to the empty object {}.
   */
  function create(isValid, initialData) {
    var data = isDefined(initialData) ? initialData : {};
    var validity = isValid(initialData);
    var m = {
      id: createId(),
      isValid: isValid,
      data: data,
      validity: validity,
      changeHandlers: []
    };
    return {
      /* Core functions */
      set: (function(newData, blockedWatchers) {
        set(m, newData, blockedWatchers);
      }),
      get: (function() { return m.data; }),
      isValid: (function() { return m.validity; }),
      watch: (function(handler, optId) { watch(m, handler, optId); }),
      unwatch: (function(watcherId) { unwatch(m, watcherId); }),
      unwatchAll: (function() { unwatchAll(m); }),

      /* Convenience functions */
      reset: (function() { set(m, initialData); }),
      clear: (function() { set(m, {}); }),
      getValidOrNothing: (function() { return getValidOrNothing(m); }),
      watchTurnValid: (function(handler) { watchTurnValid(m, handler); }),
      watchTurnInvalid: (function(handler) { watchTurnInvalid(m, handler); }),
      updateValidity: (function() { return updateValidity(m); })
    }
  }

  return {
    create: create
  }
})();
