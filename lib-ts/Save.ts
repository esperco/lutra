/*
  Utility for tracking status of API calls -- rather than show the status
  of each individual API call, this provides a global utility for showing
  whether there are *any* API calls saving user data in progress and
  whether any of those calls have failed.

  Rationale: It can very time-consuming to add save indicators everywhere
  and having them in different palces means a user might not notice them.
  Also, as far as the user is concerned, in most scenarios, there are
  only two pieces of information we want to convey: Busy (which implies
  a user should not navigate away before information has saved) and Error
  (which implies a user should stop doing things before they lose any
  more data).

  For specific corrective actions (like retrying an action), use something
  more specific to track API calls.
*/

/// <reference path="./Model.ts" />
/// <reference path="./Model2.ts" />

module Esper.Save {

  export interface Status {
    busy: boolean;
    error: boolean;
  }

  // Push callback gets called whenever a push to a store happens
  interface SaveCallback {
    (s: Status): void;
  }

  class SaveEmitter extends Emit.EmitBase {
    lastStatus: Status = { busy: false, error: false };
    data: {[index: string]: Status} = {};

    constructor() {
      super();
      this.lastStatus = { busy: false, error: false };
      this.data = {};
    }

    update(_id: string, status: Status) {
      this.data[_id] = status;
      this.emitIfChanged();
    }

    remove(_id: string) {
      delete this.data[_id];
      this.emitIfChanged();
    }

    emitIfChanged() {
      var status = {
        busy: !!_.find(this.data, (d) => d.busy),
        error: !!_.find(this.data, (d) => d.error)
      }
      if (status.busy !== this.lastStatus.busy ||
          status.error !== this.lastStatus.error) {
        this.lastStatus = status;
        super.emitChange(status);
      }
    }

    addChangeListener(fn: SaveCallback) {
      super.addChangeListener(fn);
    }

    removeChangeListener(fn: SaveCallback) {
      super.removeChangeListener(fn);
    }
  }
  export var Emitter = new SaveEmitter();

  export function monitor<K>(store: Model.Store<any>, key: string,
                             promise: JQueryPromise<any>): void;
  export function monitor<K>(store: Model2.Store<K, any>, key: K,
                             promise: JQueryPromise<any>): void;
  export function monitor(store: Emit.EmitBase, key: any,
                          promise: JQueryPromise<any>): void {
    var saveId = store.id + (key ? Util.cmpStringify(key) : "");
    return monitorStr(promise, saveId);
  }

  export function monitorStr(promise: JQueryPromise<any>, id: string): void {
    Emitter.update(id, { busy: true, error: false });
    promise.done(() => Emitter.remove(id));
    promise.fail(() => Emitter.update(id, { busy: false, error: true }));
  }


  /////

  Model.registerPushCallback(monitor);
  Model2.registerPushCallback(monitor);


  /////

  export function fakeBusy() {
    Emitter.update("fake", { busy: true, error: false });
  }

  export function fakeError() {
    Emitter.update("fake", { busy: false, error: true });
  }

  export function rmFake() {
    Emitter.remove("fake");
  }
}
