/*
  Module for fetching directory profile
*/

/// <reference path="./Login.ts" />
/// <reference path="../marten/ts/Api.ts" />
/// <reference path="../marten/ts/Model.StoreOne.ts" />

module Esper.DirProfile {

  export var Store = new Model.StoreOne<ApiT.DirProfile>();
  export var SearchStore = new Model.StoreOne<ApiT.DirProfileSearchResults>();
  export var lastSearchQuery: string;

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

  export function myProfile() {
    // Check whether the profile in store is the logged in user's profile
    if (Store.val() && Store.val().uid === Login.myUid()) return;
  }

  export function search(query: string) {
    SearchStore.set(null, {
      dataStatus: Model.DataStatus.FETCHING,
      lastError: undefined
    });
    lastSearchQuery = query;

    var onFail = function(err: Error) {
      SearchStore.set(null, {
        dataStatus: Model.DataStatus.FETCH_ERROR,
        lastError: err
      });
    }

    Api.searchDirProfile(query).then(function(result) {
      SearchStore.set(result, { dataStatus: Model.DataStatus.READY });
    }, onFail);
  }
}
