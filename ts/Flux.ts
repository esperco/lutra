/*
  Helpers and base classes for using Facebook's Flux pattern with React.
  Borrowed from https://github.com/fongandrew/typescript-flux-boilerplate

  Flux.Action is the base class for Actions that might affect our local
  datastore (or the server's datastore).

  Flux_.dispatcher is a singleton instance of Flux's Dispatcher class, which
  can dispatchers an Action to any registered event handlers.

  Flux_.Store is a base class for a basic key-value store. It stores objects of
  the form Flux_.StoreObject, which expects an `_id` and an enum indicating
  whether the object is ready or in-flight. Stores should registered with
  the dispatcher so they're updated when Actions are dispatched.

  See https://facebook.github.io/flux/docs/overview.html for more details.
*/
module Esper.Flux_ {   // Flux_ because Flux conflicts with Flux definitions

  // Base class for all types actions to dispatch ///////////
  export class Action {};

  // Singleton instance of Dispatcher, tied to a particular payload class
  export var dispatcher = new Dispatcher<Action>();


  ////////////////

  // Ready => Local state accurately reflects server (as far as we know)
  // InFlight => Local changes en route to server
  export enum DataStatus { READY, INFLIGHT };

  // Wrapper around items that get stored in Store
  export interface StoreObject<TData> {
    _id: string;
    dataStatus: DataStatus;
    lastUpdate: Date;
    data: TData;
  }


  ///////////////

  // Basic / common store related actions to be implemented alongside
  // an instance of the store

  // Action for inserting a new object into the store
  export class InsertAction<TData> extends Action {
    object: StoreObject<TData>;

    constructor(object: StoreObject<TData>) {
      super();
      this.object = object;
    }
  }

  // Action for updating an object by _id
  export class UpdateAction<TData> extends Action {
    _id: string;
    updateFn: (old: StoreObject<TData>) => StoreObject<TData>;

    // Can update either with a function that processes the old object and
    // returns a replacement, or returns a brand new replacement object
    constructor(_id: string,
                updateFn: (old: StoreObject<TData>) => StoreObject<TData>);
    constructor(_id: string,
                replacement: StoreObject<TData>);
    constructor(_id: string, update: any) {
      super();
      this._id = _id;
      if (_.isFunction(update)) {
        this.updateFn = update;
      } else {
        this.updateFn = function(old: StoreObject<TData>) {
          return update;
        };
      }
    }
  }

  // Action for removing an object with a given key from store
  // NB: Generic class not required here since we just need the _id
  export class RemoveAction extends Action {
    _id: string;

    constructor(_id: string) {
      super();
      this._id = _id;
    }
  }


  ////////////

  // Interface for map between an Action class and a function to handle
  // an instance of said class
  interface IHandler {
    actionType: { new (...args: any[]): Action };
    handler: (action: Action) => void;
  }

  // Base class for Flux Store
  export class Store<TData> extends Esper.EventEmitter {

    /*
      For simplicity we just emit a single change variable whenever any
      modification happens to a store and let the handler re-query as
      appropriate to figure out what's different. This is a little inefficient,
      but it's insignificant relative to round-trip time to a server or
      updating the actual DOM, and it makes reasoning about our code a lot
      easier.
    */
    private CHANGE_EVENT: string = "CHANGE";

    // Actual container for data
    private data: {
      [index: string]: StoreObject<TData>
    };

    // Action handlers that get called
    private handlers: IHandler[];


    ///////////

    constructor() {
      super();
      this.reset();
      this.handlers = [];
    }

    // Clears all data in store
    reset(): void {
      this.data = {};
    }

    // Returns an instance stored with a particular _id
    get(_id: string): StoreObject<TData>|void {
      if (this.exists(_id)) {
        return this.data[_id];
      }
    }

    // Return all store objects
    getAll(): StoreObject<TData>[] {
      return _.values<StoreObject<TData>>(this.data);
    }

    // Register a callback to handle store changes
    addChangeListener(callback: () => void): void {
      this.on(this.CHANGE_EVENT, callback);
    }

    // De-register a callback to handle store changes
    removeChangeListener(callback: () => void): void {
      this.removeListener(this.CHANGE_EVENT, callback);
    }

    // Register an action subclass
    handle(actionType: { new (...args: any[]): InsertAction<TData> }): void;
    handle(actionType: { new (...args: any[]): UpdateAction<TData> }): void;
    handle(actionType: { new (...args: any[]): RemoveAction }): void;
    handle(actionType: { new (...args: any[]): Action },
           handler: (action: Action) => void): void;
    handle(actionType: any, handler?: any): void {
      if (! handler) {
        let proto = actionType.prototype;
        if (proto instanceof InsertAction) {
          handler = this.insert;
        }
        else if (proto instanceof UpdateAction) {
          handler = this.update;
        }
        else if (proto instanceof RemoveAction) {
          handler = this.remove;
        }
        // Else we should never get here if TypeScript does its job
      }

      // Add handler to a list
      this.handlers.push({
        actionType: actionType,
        handler: handler
      });
    }

    // Call to have the store instance self-register with a dispatcher
    // Registered handler will compare a dispatch action to each of the store's
    // registered handlers to see if there's a type match.
    register(dispatcher: Flux.Dispatcher<Action>): void {
      let self = this;
      dispatcher.register(function(action: Action) {
        _.each(self.handlers, function(handlerObj: IHandler) {
          if (action instanceof handlerObj.actionType) {
            handlerObj.handler.call(self, action);
          }
        });
      });
    }


    ////////////

    // CRUD-related helper functions - These should be protected, not private
    // because we may to want to modify how they function in derived classes

    // Call this whenever the store is changed
    protected emitChange(): void {
      this.emit(this.CHANGE_EVENT);
    }

    // Returns true if an item exists
    protected exists(_id: string): boolean {
      return this.data.hasOwnProperty(_id);
    }

    // Set a given _id to object
    protected set(_id: string, obj: StoreObject<TData>): void {
      // Forgot set _id by accident, no biggie, just set now
      if (! obj._id) {
        obj._id = _id;
      }

      // Definitely not intended behavior
      else if (obj._id !== _id) {
        throw new Error("Object _id does not match passed _id");
      }

      this.data[_id] = obj;
    }

    // Handle InsertAction
    protected insert(action: InsertAction<TData>): void {
      let obj = action.object;
      if (! obj._id) { // No blank _ids
        throw new Error("_id is required");
      }
      if (this.exists(obj._id)) {
        throw new Error("Property already exists for store key");
      }
      this.set(obj._id, obj);
      this.emitChange();
    }

    // Handle UpdateAction
    protected update(action: UpdateAction<TData>): void {
      let _id = action._id;
      let updateFn = action.updateFn;
      if (this.exists(_id)) {
        var current = (<StoreObject<TData>> this.get(_id));
        this.set(_id, updateFn(current));
        this.emitChange();
      }
    }

    // Handle RemoveAction
    protected remove(action: RemoveAction): boolean {
      let _id = action._id;
      if (this.exists(_id)) {
        delete this.data[_id];
        this.emitChange();
      }
      return false;
    }
  }
}

