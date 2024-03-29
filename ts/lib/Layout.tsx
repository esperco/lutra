/*
  Module for rendering things (mostly React components) into an HTML page
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Route.ts" />
/// <reference path="./Views.App.tsx" />

module Esper.Layout {
  // References to our jQuery selectors (defaults to one's in esper.com pages,
  // can replace if using in a Chrome extension or other)
  export var mainSelector = "#esper-main";
  export var modalSelector = "#esper-modal";

  /*
    Renders a main React element, a header, and a footer. Renders the default
    header and footer if none are passed. Renders blank if you explicitly pass
    a null header or footer.
  */
  export function render(main: React.ReactElement<any>) {
    $(mainSelector).renderReact(main);

    /*
      window.requestAnimationFrame ensures that all synchronous JS operations
      are done before we hide the loader
    */
    window.requestAnimationFrame(function() {
      if (loaderDeferred.state() === "pending") {
        loaderDeferred.resolve(true);
      }
    });
  }

  //////

  // Close modal when user hits back button
  Route.onBack(function() {
    if (modalIsVisible()) {
      closeModal();
      return false;
    }
    return true;
  });

  // Used to track which modal is currently rendered
  var currentModalId: number = 0;

  /*
    Renders a modal into the a div near the end of the body -- closes and
    replaces any existing modal in that div
  */
  export function renderModal(modal: React.ReactElement<any>): number {
    // If modal already exists, close and wait for it to finish hiding before
    // rendering a new modal
    var modalElm = $(modalSelector).find(".modal");
    if (modalElm.is(":visible")) {
      $(modalElm).on('hidden.bs.modal', () => {
        window.requestAnimationFrame(() => renderModal(modal));
      });
      closeModal();
      return currentModalId + 1;
    }

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

    currentModalId += 1;
    return currentModalId;
  }

  // Close the current modal (optionally close only if modalId matches)
  export function closeModal(modalId?: number) {
    if (_.isUndefined(modalId) || modalId === currentModalId) {
      $(modalSelector).find(".modal").modal('hide');
    }
  }

  /*
    Updates the Modal elements in React without triggering any animation.
    Takes an optional modalId (as returned by renderModal) to tell updateModal
    to update if and only if the modalId matches
  */
  export function updateModal(modal: React.ReactElement<any>,
                              modalId?: number)
  {
    var modalContainer = $(modalSelector).children("div:last");
    if (modalIsVisible(modalId)) {
      // Container exists, update if modalId matches
      $(modalContainer).renderReact(modal);
    } else if (_.isUndefined(modalId)) {
      // Container doesn't exist, render for first time
      renderModal(modal);
    }
  }

  // Is the modal (with an optional modalId) visible?
  export function modalIsVisible(modalId?: number) {
    if ($(modalSelector).find(".modal").is(":visible")) {
      return _.isUndefined(modalId) || modalId === currentModalId;
    }
    return false;
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
