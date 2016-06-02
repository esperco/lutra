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
    strFunc?: (args: any[]) => string;

    // Cache timeout in milliseconds
    timeout?: number;
  }

  interface HasStore<T> {
    store: Model.CappedStore<T>;
    strFunc: (args: any[]) => string;
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

      makeC<typeof Api.postTokenEmail, ApiT.TokenResponse>(Api.postTokenEmail)

  */
  export function makeC<A,T>(fn: ApiFn<T> & A, opts?: CacheOpts<T>):
        A & HasStore<T>
  {
    opts = opts || {};
    var store: Model.CappedStore<T> = opts.store || defaultStore;
    var strFunc = opts.strFunc;
    if (! strFunc) {
      /*
        Create a unique identifier for this makeC call -- this will get
        prepended to the argument list for the strFunc to avoid collisions
        between API calls using the same store
      */
      var prefix = Util.randomString();
      strFunc = function(a: any[]) {
        return Util.cmpStringify([prefix].concat(a));
      }
    }

    // Generic map of keys to promises scoped outside function
    var promises: {[index: string]: JQueryPromise<T>} = {};

    // OK to use any type for purpose of constructing our new function
    // since it'll be converted back to strongly typed when returned.
    var ret: any = function(/* varargs */) {
      var key = strFunc(_.toArray<any>(arguments));

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

      // Call original function and attach promise handlers that update our
      // stores
      promise = promises[key] = (<any> ret.orig).apply(Api, arguments);

      // Tie store updates to promise resolution / rejection
      store.fetch(key, promise);

      promise.always(function() {
        // Clean up old promises in memory
        if (promises[key] === promise) {
          delete promises[key];
        }
      });

      return promise;
    };

    ret.orig = fn;
    ret.store = store;
    ret.strFunc = strFunc;
    ret._promises = promises; // Expose for debugging only (not in type)
    return (<A & HasStore<T>> ret);
  }


  // Actual API Calls /////////////////

  export var getAllPreferences = makeC
    <typeof Api.getAllPreferences, ApiT.PreferencesList>
    (Api.getAllPreferences);

  export var getAllProfiles = makeC
    <typeof Api.getAllProfiles, ApiT.ProfileList>
    (Api.getAllProfiles);

  export var getCalendarList = makeC
    <typeof Api.getCalendarList, ApiT.Calendars>
    (Api.getCalendarList);

  export var getGenericCalendarListOfUser = makeC
    <typeof Api.getGenericCalendarListOfUser, ApiT.GenericCalendars>
    (Api.getGenericCalendarListOfUser);

  export var getGenericCalendarList = makeC
    <typeof Api.getGenericCalendarList, ApiT.GenericCalendars>
    (Api.getGenericCalendarList);

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

  export var postForDailyStats = makeC
    <typeof Api.postForDailyStats, ApiT.DailyStatsResponse>
    (Api.postForDailyStats, {
      store: new Model.CappedStore<ApiT.DailyStatsResponse>()
    });

  export var getTaskListForEvent = makeC
    <typeof Api.getTaskListForEvent, ApiT.Task[]>
    (Api.getTaskListForEvent, {
      store: new Model.CappedStore<ApiT.Task[]>()
    });
}
