/*
  Module for fetching directory profile
*/

/// <reference path="./Login.ts" />
/// <reference path="../marten/ts/Api.ts" />
/// <reference path="../marten/ts/Model.StoreOne.ts" />

module Esper.DirProfile {

  export var Store = new Model.StoreOne<ApiT.DirProfile>();

  var profileDeferred: JQueryDeferred<ApiT.DirProfile> = $.Deferred();
  export var profilePromise = profileDeferred.promise();

  export function init() {
    Store.set(null, { dataStatus: Model.DataStatus.FETCHING });

    var onFail = function(err: Error) {
      Store.set(null, {
        dataStatus: Model.DataStatus.FETCH_ERROR,
        lastError: err
      });
      profileDeferred.reject(err);
    };

    Login.loginPromise.then(function() {
      Api.getDirProfile()
        .then(function(dirProfile) {
          Store.set(dirProfile, { dataStatus: Model.DataStatus.READY });
          profileDeferred.resolve(dirProfile);
        }, onFail);
    }, onFail);
  }
}
