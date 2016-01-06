/*
  Module for fetching login state of Otter and retrieving loginInfo
*/

/// <reference path="../marten/ts/Analytics.Web.ts" />
/// <reference path="../marten/ts/Api.ts" />
/// <reference path="../marten/ts/Login.Oauth.ts" />
/// <reference path="../marten/ts/Model.StoreOne.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Layout.tsx" />

module Esper.Login {
  export var InfoStore = new Model.StoreOne<ApiT.LoginResponse>();

  var initialized = false;

  // Set approval handling code for teams
  approvalHandler = function(info: ApiT.LoginResponse)
    : JQueryPromise<ApiT.LoginResponse>
  {
    var dfd = $.Deferred();
    Layout.renderModal(React.createElement(Components.ApproveTeamsModal, {
      info: info,
      onApprove: (info: ApiT.LoginResponse) => dfd.resolve(info)
    }));
    return dfd.promise();
  }

  // Set callback for when loginInfo is set
  export function init() {

    // Set up callbacks if not already set up
    if (! initialized) {
      onSuccess(function(loginInfo) {
        InfoStore.set(loginInfo, { dataStatus: Model.DataStatus.READY });
        Analytics.identify(loginInfo, true);
        if (loginInfo && Esper.Raven) {
          Raven.setUserContext({
            email: loginInfo.email,
            id: loginInfo.uid,
            platform: loginInfo.platform
          });
        }
      });
      initialized = true;
    }

    // This starts OAuth storage check and getLoginInfo sequence
    initLogin();
  }

  export function logout() {
    clear();
    Analytics.identify(null); // Resets identity
    window.location.reload();
  }
}