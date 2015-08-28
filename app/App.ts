/* This module is used for the Marten app created to test individual modules */

/// <reference path="./Esper.ts"/>
/// <reference path="../ts/Util.ts"/>
/// <reference path="../ts/Log.ts"/>
/// <reference path="../ts/Model.ts"/>
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
