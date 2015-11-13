/* This module is used for the Marten app created to test individual modules */

/// <reference path="./Esper.ts"/>
/// <reference path="../marten/ts/Util.ts"/>
/// <reference path="../marten/ts/Log.ts"/>
/// <reference path="../marten/ts/Emit.ts"/>
/// <reference path="../marten/ts/Model.ts"/>
/// <reference path="../marten/ts/Model.Capped.ts"/>
/// <reference path="../marten/ts/Model.StoreOne.ts"/>
/// <reference path="../marten/ts/Model.Batch.ts" />
/// <reference path="../marten/ts/JQStore.ts"/>
/// <reference path="../marten/ts/ReactHelpers.ts"/>
/// <reference path="./IndexPage.tsx"/>


module Esper.App {

  export function init() {
    $(document).ready(function() {
      var rootElm = $("#esper-root").get(0);
      if (rootElm) {
        React.render(
          React.createElement(IndexPage.IndexPage),
          rootElm);
      } else {
        Log.info("Esper root not found.");
      }
    });
  }
}

Esper.App.init();
