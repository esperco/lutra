/*
  A wrapper around the EventEmitter class for simplified updates based on
  changes.
*/
/// <reference path="./Util.ts" />

declare module Esper {
  export var EventEmitter: typeof EventEmitter3.EventEmitter;
}

module Esper.Emit {
  export abstract class EmitBase extends EventEmitter {
    public id: string;

    constructor() {
      super();
      this.id = Util.randomString(); // Random identifier for each emitter
    }

    /*
      For simplicity we just emit a single change variable whenever any
      modification happens to a store. We can pass along a list of _id changes
      but otherwise we let the handler re-query as appropriate to figure out
      what's different. This may be a little inefficient, but it's
      insignificant relative to round-trip time to a server or updating the
      actual DOM, and it makes reasoning about our code a lot easier.
    */
    protected CHANGE_EVENT: string = "CHANGE";

    // Register a callback to handle changes
    addChangeListener(callback: (...args: any[]) => void): void {
      this.on(this.CHANGE_EVENT, callback);
    }

    // De-register a callback to handle changes
    removeChangeListener(callback: (...args: any[]) => void): void {
      this.removeListener(this.CHANGE_EVENT, callback);
    }

    // Remove all callbacks
    removeAllChangeListeners(): void {
      this.removeAllListeners(this.CHANGE_EVENT);
    }

    /*
      Use to track whether emitChange has been called during an emitChange
      cycle. The purpose of this is maintain unidirectional data flow. State
      changes trigger event callbacks that further update the state are
      difficult to reason about. They also run the risk of setting off an
      infinite loop.
    */
    protected alreadyEmitted = false;

    // Call this whenever the store is changed.
    protected emitChange(...args: any[]): void {
      if (this.alreadyEmitted) {
        throw new Error("Unidirectional data flow error: Cannot update " +
          "store via change handler");
      }

      this.alreadyEmitted = true;
      try {
        if (args) {
          this.emit.apply(this, [this.CHANGE_EVENT].concat(args));
        } else {
          this.emit(this.CHANGE_EVENT);
        }
      } finally {
        this.alreadyEmitted = false;
      }
    }
  }
}
