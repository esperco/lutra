/*
  Serializable stream of k/v updates. Use to keep two stores in sync. Delta
  streams are capped, so they're not a reliable way to keep track of long-term
  persistent data, but they can be used to persist recent data.
*/

/// <reference path="./Util.ts" />
/// <reference path="./Model.ts" />

module Esper.Delta {

  // Can be overriden
  var DEFAULT_CAP = 100;

  // A wrapper around a Model.Store that listens to its changes and can be
  // used to publish serialized updates or process updates from other SyncWrap
  // instances wrapping the Model.Store class
  export class SyncWrap<T> extends Model.StoreBase<T> {
    // Deltas are 3-tuples of delta UID, ID for store object, and object data
    protected deltaList: Array<[string, string, T]> = [];

    // Used by changeListener to determine whether to push to deltaList. We
    // disable while processing to avoid circular / infinite update loops.
    protected active: boolean = true;

    constructor(public store: Model.Store<T>, public cap=DEFAULT_CAP) {
      super();
      this.store.addChangeListener(this.changeListener.bind(this));
    }

    changeListener(_ids: string[]) {
      if (!this.active) { return; }
      var self = this;
      _.each(_ids, function(_id) {
        var update = self.store.get(_id);
        Util.pushToCapped(
          self.deltaList,
          [Util.randomString(), _id, update ? update[0] : null],
          self.cap,

          // Override existing updates that match store id (not update id)
          function(a,b) {
            return a[1] === b[1];
          });
      });
      this.emitChange(_ids);
    }

    serialize(): Array<[string, string, T]> {
      return this.deltaList;
    }

    // Use to temporarily disable our changeListener while making updates
    withInactive(fn: () => void) {
      this.active = false;
      fn();
      this.active = true;
    }

    parse(updates: Array<[string, string, T]>) {
      var self = this;

      _.each(updates, function(tuple) {
        var updateId = tuple[0];
        var storeId = tuple[1];
        var data = tuple[2];

        var alreadyExists = _.find(self.deltaList, function(t) {
          return t[0] === updateId;
        });
        if (! alreadyExists) {

          // Deactivate update handler to avoid infinite loops
          self.withInactive(function() {
            if (data) {
              self.store.upsert(storeId, data);
            } else {
              self.store.remove(storeId);
            }
          });

          // NB: We track the last X updates in our deltaList rather than just
          // the last 1 because deltaList serialization may consolidate items
          // with the same store key
          Util.pushToCapped(self.deltaList, tuple, self.cap,
            function(a, b): boolean {
              return a[0] === b[0];
            });
        }
      });
    }
  }
}
