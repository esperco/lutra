/*
  Stoat-specific additions to APIs
*/

/// <reference path="../marten/ts/JsonHttp.ts" />
/// <reference path="../marten/ts/Api.ts" />
/// <reference path="./Conf.ts" />

module Esper.Api {
  export function checkVersion():
    JQueryPromise<ApiT.ChromeSupport> {
    return JsonHttp.get(prefix + "/api/support/chrome/" + Conf.version);
  }

  export function init() {
    JsonHttp.esperVersion = "stoat-" + Conf.version;
    prefix = Conf.Api.url;
  }
}