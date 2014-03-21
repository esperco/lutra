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
    return idCounter++;
  }

  /*
    Try to acquire a lock, returning true if successful.
    Locks expire after a while as a soft protection against
    various errors that would cause a lock to not be released.
  */
  function lock(id) {
    var d = locks[id];
    var now = date.now();
    if (d != null && now.UTC() <= d.UTC() + lockTimeout)
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
  */
  function watch(m, handler) {
    m.changeHandlers.push(handler);
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

  function unwatch(m) {
    m.changeHandlers = [];
  }

  /*
    Set a value.
    The lock prevents a value from being set twice during the same
    (synchronous) call.
  */
  function set(m, newData) {
    var id = m.id;
    if (lock(id)) {
      var oldValidity = m.validity;
      var oldData = m.data;
      var newValidity = m.isValid(newData);
      m.data = newData;
      m.validity = newValidity;

      var n = m.changeHandlers.length;
      for (var i = 0; i < n; i++) {
        var handler = m.changeHandlers[i];
        handler(newData, newValidity,
                oldData, oldValidity);
      }
      unlock(id);
    }
  }

  /*
    Get the data only if it is valid, otherwise return null.
    Avoids returning data with only some of the required fields.
   */
  function getAllOrNothing(m) {
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
      set: (function(newData) { set(m, newData); }),
      get: (function() { return m.data; }),
      isValid: (function() { return m.validity; }),
      watch: (function(handler) { watch(m, handler); }),
      unwatch: (function() { unwatch(m); }),

      /* Convenience functions */
      reset: (function() { set(m, initialData); }),
      clear: (function() { set(m, {}); }),
      getAllOrNothing: (function() { return getAllOrNothing(m); }),
      watchTurnValid: (function(handler) { watchTurnValid(m, handler); }),
      watchTurnInvalid: (function(handler) { watchTurnInvalid(m, handler); }),
    }
  }

  return {
    create: create
  }
})();
