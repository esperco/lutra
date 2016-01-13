/*
  Module for rendering things (mostly React components) into our HTML page
*/

/// <reference path="../typings/bootstrap/bootstrap.d.ts" />
/// <reference path="../lib/ReactHelpers.ts" />

module Esper.Layout {
  // References to our jQuery selectors
  export var mainSelector = "#esper-main";
  export var headerSelector = "#esper-header";
  export var footerSelector = "#esper-footer";
  export var loadingSelector = "#esper-loading";
  export var modalSelector = "#esper-modal";

  /*
    Renders a main React element, a header, and a footer. Renders the default
    header and footer if none are passed. Renders blank if you explicitly pass
    a null header or footer.
  */
  export function render(main: React.ReactElement<any>,
                         header?: React.ReactElement<any>,
                         footer?: React.ReactElement<any>) {
    header = header || <span />;
    $(headerSelector).show().renderReact(header);

    $(mainSelector).renderReact(main);

    footer = footer || <span />;
    $(footerSelector).renderReact(footer);

    /*
      window.requestAnimationFrame ensures that all synchronous JS operations
      are done before we hide the loader
    */
    window.requestAnimationFrame(hideLoader);
  }

  /*
    Renders a modal into the a div near the end of the body -- replaces any
    existing modal in that div
  */
  export function renderModal(modal: React.ReactElement<any>) {
    $(modalSelector).empty();

    /*
      Add an extra container layer for modal because modal needs to remove
      its parent to trigger unmounting functions
    */
    var modalContainer = $('<div />').appendTo(modalSelector);
    $(modalContainer).renderReact(modal);

    window.requestAnimationFrame(function() {
      $(modalSelector + " .modal").modal("show");
    });
  }

  // Override these functions to change behavior
  export function defaultHeader() {
    return <span />;
  }

  export function defaultFooter() {
    return <span />;
  }

  // Hide the loading screen
  function hideLoader() {
    var loading = $(loadingSelector);
    if ((loading).is(":visible")) {
      var hide = function() {
        loading.hide();
        loaderDeferred.resolve(true);
      };

      loading
        .addClass("fade-out")
        .on('transitionend webkitTransitionEnd oTransitionEnd', hide);

      // Set max 3 second timeout in case transitionend doesn't fire
      setTimeout(hide, 3000);
    }
  }

  /*
    Promise that resolves when loader is hidden -- used in testing. Could
    be useful elsewhere.

    NB: The loader referenced here is intended to be a temporary indicator
    for the *initial* load of the site. Use something else for busy indicators
    or page transitions.
  */
  var loaderDeferred = $.Deferred();
  export var onLoaderHide = loaderDeferred.promise();
}
