/// <reference path="./Esper.ts"/>

module Esper.App {

  export function init() {
    $(window).load(function() {
      console.log("Super loaded");
    });
  }
}

Esper.App.init();
