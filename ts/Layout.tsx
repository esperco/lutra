/*
  Module for rendering things (mostly React components) into our HTML page
*/

/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="./Views.Header.tsx" />
/// <reference path="./Views.Footer.tsx" />

module Esper.Layout {
  // References to our jQuery selectors
  export var mainSelector = "#esper-main";
  export var headerSelector = "#esper-header";
  export var footerSelector = "#esper-footer";
  export var loadingSelector = "#esper-loading";

  /*
    Renders a main React element, a header, and a footer. Renders the default
    header and footer if none are passed. Renders blank if you explicitly pass
    a null header or footer.
  */
  export function render(main: React.ReactElement<any>,
                         header?: React.ReactElement<any>,
                         footer?: React.ReactElement<any>) {
    if (header === null) { // Null => means intentionally hide
      header = <span></span>;
    } else {
      header = header || defaultHeader();
    }
    $(headerSelector).show().renderReact(header);

    $(mainSelector).renderReact(main);

    if (footer === null) { // Null => means intentionally hide
      footer = <span></span>;
    } else {
      footer = footer || defaultFooter();
    }
    $(footerSelector).renderReact(footer);

    /*
      window.requestAnimationFrame ensures that all synchronous JS operations
      are done before we hide the loader
    */
    window.requestAnimationFrame(hideLoader);
  }

  function defaultHeader() {
    return <Views.Header />;
  }

  function defaultFooter() {
    return <Views.Footer />;
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