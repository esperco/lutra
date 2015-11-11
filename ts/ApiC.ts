/*
  Caching for API calls
*/

/// <reference path="./Api.ts" />
/// <reference path="./Model.Capped.ts" />
/// <reference path="./Util.ts" />

module Esper.ApiC {

  interface ApiFn<T> {
    (...args: any[]): JQueryPromise<T>;
  }

  /*
    NB: The (...args: any[]) signature should correspond to the API function's
    signature. It'd be nice if we could use type inference to check that but
    that depends on variadic signatures making their way into TypeScript.

    https://github.com/Microsoft/TypeScript/issues/5453
  */
  interface CacheOpts<T> {
    // Store to save stuff
    store?: Model.CappedStore<T>;

    // Function for converting arguments to API function to string id
    strFunc?: (...args: any[]) => string;

    // Cache timeout in milliseconds
    timeout?: number;
  }

  interface HasStore<T> {
    store: Model.CappedStore<T>;
    strFunc: (...args: any[]) => string;
  }

  /*
    Default API cache -- create sub-stores to ensure sub-caps.
    Note that although the type is "any" here, calling ApiC.fn.store will
    infer the type used in the wrapped Api.fn.
  */
  var defaultStore = new Model.CappedStore<any>(100);

  /*
    Helper function to let us know whether we can update a datastore
    during the update process. If we're fetching, we should not update
    if dataStatus indicates unsaved user data.
  */
  function canSave(metadata: Model.StoreMetadata): boolean {
    var dataStatus = metadata && metadata.dataStatus;
    return (dataStatus !== Model.DataStatus.UNSAVED &&
            dataStatus !== Model.DataStatus.INFLIGHT);
  }


  /*
    Trying to use intersection type to ensure makeC returns same type as
    the API function it's wrapping, and to indicate that return result has a
    store / event-emitter attached.

    Doesn't work (see https://github.com/Microsoft/TypeScript/issues/5456),
    so until that's resolved, you'll need to explicitly pass A and T as
    type parameters to make type-checking work, e.g.:

      makeC<typeof Api.postTokenEmail, ApiT.TokenInfo>(Api.postTokenEmail)

  */
  export function makeC<A,T>(fn: ApiFn<T> & A, opts?: CacheOpts<T>):
        A & HasStore<T>
  {
    opts = opts || {};
    var store: Model.CappedStore<T> = opts.store || defaultStore;
    var strFunc = opts.strFunc || Util.cmpStringify;

    // Generic map of keys to promises scoped outside function
    var promises: {[index: string]: JQueryPromise<T>} = {};

    // OK to use any type for purpose of constructing our new function
    // since it'll be converted back to strongly typed when returned.
    var ret: any = function(/* varargs */) {
      var key = strFunc(arguments);

      // If existing promise pending, return that
      var promise = promises[key];
      if (promise && promise.state() === "pending") {
        return promise;
      }

      // If value READY and not stale, resolve and return that
      if (store.has(key)) {
        var metadata = store.metadata(key);
        if (metadata.dataStatus === Model.DataStatus.READY) {
          if (!opts.timeout || metadata.lastUpdate.getTime() + opts.timeout >
                               (new Date()).getTime())
          {
            var dfd = $.Deferred();
            dfd.resolve(store.val(key));
            return dfd.promise();
          }
        }
      }

      // Set to FETCHING (but don't override UNSAVED or INFLIGHT to preserve
      // any user-set data we may have cached)
      store.upsert(key, function(data: T, metadata: Model.StoreMetadata)
        : T | [T, Model.StoreMetadata]
      {
        if (canSave(metadata)) {
          return [data, _.extend({}, metadata, {
            dataStatus: Model.DataStatus.FETCHING
          })];
        }
        return data;
      });

      // Call original function and attach promise handlers that update our
      // stores
      promise = promises[key] = (<any> fn).apply(Api, arguments);
      promise.done(function(newData: T) {
        // On success, update store
        store.upsert(key, function(data: T, metadata: Model.StoreMetadata)
            : T | [T, Model.StoreMetadata]
          {
            if (canSave(metadata)) {
              return [newData, _.extend({}, metadata, {
                dataStatus: Model.DataStatus.READY
              })];
            }
            return data;
          });
        return newData;

      }).fail(function(err) {
        // On failure, update store to note failure (again, don't override
        // user data)
        store.upsert(key, function(data: T, metadata: Model.StoreMetadata)
            : T | [T, Model.StoreMetadata]
          {
            if (canSave(metadata)) {
              return [data, _.extend({}, metadata, {
                dataStatus: Model.DataStatus.FETCH_ERROR,
                lastError: err
              })];
            }
            return data;
          });

        // Clean up old promises in memory
        if (promises[key] === promise) {
          delete promises[key];
        }

        return err;
      });

      return promise;
    };

    ret.store = store;
    ret.strFunc = strFunc;
    ret._promises = promises; // Expose for debugging only (not in type)
    return (<A & HasStore<T>> ret);
  }


  // Actual API Calls /////////////////

  export var getCalendarList = makeC
    <typeof Api.getCalendarList, ApiT.Calendars>
    (Api.getCalendarList);

  export var postCalendar = makeC
    <typeof Api.postCalendar, ApiT.CalendarEventList>
    (Api.postCalendar, {
      store: new Model.CappedStore<ApiT.CalendarEventList>()
    });

  export var postForCalendarStats = makeC
    <typeof Api.postForCalendarStats, ApiT.CalendarStatsResult>
    (Api.postForCalendarStats, {
      store: new Model.CappedStore<ApiT.CalendarStatsResult>()
    });

  export var getTaskListForEvent = makeC
    <typeof Api.getTaskListForEvent, ApiT.Task[]>
    (Api.getTaskListForEvent, {
      store: new Model.CappedStore<ApiT.Task[]>()
    });
}