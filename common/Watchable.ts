/*
  Mutable boxes holding a value.

  Watchers can be registered and react when the value changes.
  Watchers become active only after initialization, i.e. they won't be called
  during the creation process.
*/

module Esper.Watchable {

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

  function objectOfIdArray(a) {
    var obj = {};
    for (var i = 0; i < a.length; i++) {
      var k = a[i];
      obj[k] = true;
    }
    return obj;
  }

  function isDefined(x) {
    return typeof x != "undefined";
  }

  interface Watcher<T> {
    id: string;
    handler: { (newData: T, newValidity: boolean,
                oldData: T, oldValidity: boolean): void };
  }

  /*
    Input:
    - isValid(data) : bool - decides whether the data is valid
    - initialData - initial data of any type; defaults to the empty object {}.
   */
  export class Watchable<T> {
    private id: string;
    isValid: { (T): boolean };
    private data: T;
    private validity: boolean;
    private changeWatchers: Watcher<T> [];

    constructor(isValid: { (T): boolean },
                initialData: T) {
      this.id = createId();
      this.isValid = isValid;
      this.data = initialData;
      this.validity = isValid(initialData);
      this.changeWatchers = [];
    }

    /*
      Register a general-purpose handler, executed each time the data
      field is set.
      Return a watcher ID.
    */
    watch(handler,
          optWatcherId? : string) {
      var id = optWatcherId === undefined ? createId() : optWatcherId;
      this.changeWatchers.push({ id: id, handler: handler });
      return id;
    }

    /*
      Convenience function for registering a handler executed only
      when the data field goes from invalid to valid.
    */
    watchTurnValid(simpleHandler) {
      function handler(newData, newValidity,
                       oldData, oldValidity) {
        if (newValidity && !oldValidity) {
          simpleHandler(newData, oldData);
        }
      }
      this.watch(handler);
    }

    /*
      Convenience function for registering a handler executed only
      when the data field goes from valid to invalid.
    */
    watchTurnInvalid(simpleHandler) {
      function handler(newData, newValidity,
                       oldData, oldValidity) {
        if (!newValidity && oldValidity) {
          simpleHandler(newData, oldData);
        }
      }
      this.watch(handler);
    }

    unwatch(watcherId) {
      this.changeWatchers =
        List.filter(this.changeWatchers, function(watcher) {
          return watcher.id !== watcherId;
        });
    }

    unwatchAll() {
      this.changeWatchers = [];
    }

    /*
      Set a value.
      The lock prevents a value from being set twice during the same
      (synchronous) call.

      optBlockedWatchers is an optional list of watcher IDs that should
      be disabled.
    */
    set(newData, optBlockedWatchers) {
      var id = this.id;
      var blockedWatchers =
        optBlockedWatchers === undefined ? {}
      : objectOfIdArray(optBlockedWatchers);
      if (lock(id)) {
        Log.d("ref["+ id +"]: set value", newData);
        var oldValidity = this.validity;
        var oldData = this.data;
        var newValidity = this.isValid(newData);
        this.data = newData;
        this.validity = newValidity;

        var n = this.changeWatchers.length;
        for (var i = 0; i < n; i++) {
          var watcher = this.changeWatchers[i];
          var watcherId = watcher.id;
          if (blockedWatchers[watcherId] === undefined) {
            Log.d("ref["+ id +"]: activate watcher " + watcherId);
            watcher.handler(newData, newValidity,
                            oldData, oldValidity);
          }
        }
        unlock(id);
      }
    }

    updateValidity() {
      this.validity = this.isValid(this.data);
    }

    /*
      Get the data only if it is valid, otherwise return null.
      Avoids returning data with only some of the required fields.
    */
    getValidOrNothing() {
      return this.validity ? this.data : null;
    }

  }
}
