/*
  Helpers and base classes for using Facebook's Flux pattern with React.
  Borrowed from https://github.com/fongandrew/typescript-flux-boilerplate

  Flux.Action is the base class for Actions that might affect our local
  datastore (or the server's datastore).

  Flux_.dispatcher is a singleton instance of Flux's Dispatcher class, which
  can dispatchers an Action to any registered event handlers.

  Flux_.Store is a base class for a basic key-value store. It stores 2-tuples
  of a particular data type and metadata. Stores should registered with
  the dispatcher so they're updated when Actions are dispatched.

  See https://facebook.github.io/flux/docs/overview.html for more details.
*/
module Esper.Flux_ {   // Flux_ because Flux conflicts with Flux definitions

  // Base class for all types actions to dispatch ///////////
  export class Action {};

  // Singleton instance of Dispatcher, tied to a particular payload class
  export var AppDispatcher = new Dispatcher<Action>();


  ////////////////

  // Ready => Local state accurately reflects server (as far as we know)
  // InFlight => Local changes en route to server
  export enum DataStatus { READY, INFLIGHT };

  // Metadata that lives alongside the actual object data -- need at least
  // an identifier
  export interface StoreMetadata {
    _id: string;
    dataStatus?: DataStatus;
    lastUpdate?: Date;
  }


  ///////////////

  // Basic / common store related actions to be implemented alongside
  // an instance of the store

  // Action for inserting a new object into the store
  export class InsertAction<TData> extends Action {
    data: TData;
    metadata: StoreMetadata;

    constructor(_id: string, data: TData);
    constructor(data: TData, metadata: StoreMetadata);
    constructor(firstArg: any, secondArg: any) {
      super();
      var _id: string;
      var data: TData;
      var metadata: StoreMetadata;
      if (_.isString(firstArg)) {
        this.metadata = { _id: (<string> firstArg) };
        this.data = (<TData> secondArg);
      }
      else {
        this.metadata = (<StoreMetadata> secondArg);
        this.data = (<TData> firstArg);
      }
    }
  }

  // An update function is a function that receives data and metadata and
  // returns either the updated object or an updated object/metadata pairing
  interface updateFn<TData> {
    (): TData|[TData, StoreMetadata];
    (oldData: TData, oldMetadata: StoreMetadata): TData|[TData, StoreMetadata];
  }

  // Action for updating an object by _id
  export class UpdateAction<TData> extends Action {
    _id: string;
    updateFn: updateFn<TData>;
    upsert: boolean;

    // Can update either with a function that processes the old object and
    // returns a replacement, or returns a brand new replacement object
    constructor(_id: string, updateFn: updateFn<TData>, upsert?: boolean);
    constructor(_id: string, replacement: TData, upsert?: boolean);
    constructor(_id: string, update: any, upsert?: boolean) {
      super();
      this._id = _id;
      if (_.isFunction(update)) {
        this.updateFn = update;
      } else {
        this.updateFn = function() { return update; };
      }
      this.upsert = !!upsert;
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
      [index: string]: [TData, StoreMetadata];
    };

    // Action handlers that get called
    private handlers: IHandler[];

    // Set when registering with dispatcher, use with waitFor
    dispatchToken: string;


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
    get(_id: string): [TData, StoreMetadata] {
      if (this.exists(_id)) {
        return this.data[_id];
      }
    }

    // Return all store objects
    getAll(): [TData, StoreMetadata][] {
      return _.values<[TData, StoreMetadata]>(this.data);
    }

    // Register a callback to handle store changes
    addChangeListener(callback: () => void): void {
      this.on(this.CHANGE_EVENT, callback);
    }

    // De-register a callback to handle store changes
    removeChangeListener(callback: () => void): void {
      this.removeListener(this.CHANGE_EVENT, callback);
    }

    // Remove all listeners
    removeAllChangeListeners(): void {
      this.removeAllListeners(this.CHANGE_EVENT);
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
      self.dispatchToken = dispatcher.register(function(action: Action) {
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
    protected set(_id: string, tuple: [TData, StoreMetadata]): void;
    protected set(_id: string, data: TData, metadata?: StoreMetadata): void;
    protected set(_id: string, firstArg: any, secondArg?: any): void {
      var data: TData;
      var metadata: StoreMetadata;
      if (secondArg) {
        data = (<TData> firstArg);
        metadata = (<StoreMetadata> secondArg);
      } else if (firstArg instanceof Array) {
        data = (<TData> firstArg[0]);
        metadata = (<StoreMetadata> firstArg[1]);
      } else {
        data = (<TData> firstArg);
      }
      metadata = this.cleanMetadata(_id, data, metadata);
      this.data[_id] = [data, metadata];
    }

    // Hook to preset metadata before it's set
    protected cleanMetadata(_id: string, data: TData, metadata?: StoreMetadata)
      : StoreMetadata
    {
      // Make sure _id matches
      if (metadata) {
        metadata._id = _id;
      }
      else {
        metadata = { _id: _id };
      }

      // Some defaults and overrides
      metadata.dataStatus = metadata.dataStatus || DataStatus.READY;
      metadata.lastUpdate = new Date();
      return metadata;
    };

    // Handle InsertAction
    protected insert(action: InsertAction<TData>): void {
      let data = action.data;
      let metadata = action.metadata;
      let _id = metadata._id;
      if (this.exists(_id)) {
        throw new Error("Property already exists for store key: " + _id);
      }
      this.set(metadata._id, [data, metadata]);
      this.emitChange();
    }

    // Handle UpdateAction
    protected update(action: UpdateAction<TData>): void {
      let _id = action._id;
      let updateFn = action.updateFn;
      var exists = this.exists(_id);
      if (exists || action.upsert) {
        let data: TData;
        let metadata: StoreMetadata;
        let current: [TData, StoreMetadata];
        let response: any;

        if (exists) {
          current = this.get(_id);
          response = updateFn(current[0], current[1]);
        } else {
          response = updateFn();
        }

        if (response instanceof Array && response.length === 2) {
          data = (<[TData, StoreMetadata]> response)[0];
          metadata = (<[TData, StoreMetadata]> response)[1];
        } else {
          data = (<TData> response);
          metadata = exists ? current[1] : null;
        }

        this.set(_id, data, metadata);
        this.emitChange();
      }

      else {
        throw new Error("Store key does not exist: " + _id);
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

