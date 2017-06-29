/*
  Generic, asynchronous computation with emission of change event at end of
  calculation. Starts when something starts listening and quits when no one
  is listening.
*/
module Esper {

  // T is both a state and accumulator object
  export class Calc<T> extends Emit.EmitBase {
    // Are we there yet?
    ready = false;
    running = true;

    // Intermediate state for use with progressive calculation. Also output.
    _state: T;

    // Saved by contructor
    _process: (input: T) => { next: T, done?: boolean };

    constructor(
      // Starting value
      input: T,

      /*
        Processing function
        - Return { state: S } to signal there's still work to do
        - Return { results: O } to signal completion
      */
      process: (input: T) => { next: T, done?: boolean }
    ) {
      super();
      this._state = input;
      this._process = process;
      this.ready = false;
      this.running = false;
    }

    // Returns some grouping if done, none if not complete
    getOutput(): Option.T<T> {
      return this.ready ?
        Option.some(this._state) :
        Option.none<T>();
    }

    // Start calulations based on passed events
    start() {
      this.running = true;
      this.next();
    }

    stop() {
      this.running = false;
    }

    /* Start-stop based on presence of listeners */

    // Register a callback to handle changes
    addChangeListener(callback: (...args: any[]) => void): void {
      super.addChangeListener(callback);
      if (! this.running) this.start();
    }

    // De-register a callback to handle changes
    removeChangeListener(callback: (...args: any[]) => void): void {
      super.removeChangeListener(callback);
      if (! this.changeListeners().length) {
        this.stop();
      }
    }

    // Remove all callbacks
    removeAllChangeListeners(): void {
      super.removeAllChangeListeners();
      this.stop();
    }

    /*
      Recursive "loop" that calls processBatch until we're done. Auto-bind so
      we can easily reference function by name and avoid recursion limits
    */
    runLoop = () => {
      if (! this.running) return;

      // Run once, store next state
      var resp = this._process(this._state);
      this._state = resp.next;

      // Done => return
      if (resp.done) {
        this.ready = true;
        this.running = false;
        this.emitChange();
      }

      // Not done yet
      else {
        this.next();
      }
    }

    next() {
      window.requestAnimationFrame(this.runLoop);
    }

    onceChange(fn: (output: T) => void) {
      super.once(this.CHANGE_EVENT, () => fn(this._state));
    }
  }
}
