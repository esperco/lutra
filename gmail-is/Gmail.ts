/*
  Extraction of data from the Gmail document and JavaScript environment.
*/

module Esper.Gmail {

  /*
    Find a good insertion point for the menu icon in the top navigation bar.
  */
  export function findMenuAnchor() {
    var anchor = $("#gbwa");
    if (anchor.length !== 1) {
      Log.i("Cannot find anchor point for the Esper menu just yet.");
      return $();
    }
    else
      return anchor;
  }

  export function removeWebClipBanner() {
    var banner = $(".g .mq");

    if (banner.length === 0) {
      Log.w("Web clips are turned off.");
      return $();
    } else {
      Log.i("Removing web clip banner.");
      banner[0].remove();
    }
  }

  export function findSidebarAnchor() {
    var anchor = $(".nH.g.id");

    if (anchor.length !== 1) {
      Log.w("Cannot find anchor point for the Esper sidebar.");
      return $();
    } else {
      Log.i("Found anchor point for the Esper sidebar.");
      return anchor;
    }
  }

  /** Returns the tbody that contains the composition toolbar. This is
   *  the bar with the send button, the attachment tool and so
   *  on. Since there can be any number of these on the page at a
   *  time, this can return any number of elements.
   */
  export function compositionToolbar() {
    return $("div.aDg div.aDh");
  }

  /** Returns the closest editable field to the given div. This is
   *  useful for going from the menu to the actual reply field.
   */
  export function replyTextField(toolbar) {
    return toolbar.closest("table.iN").find(".editable");
  }

  /** Given a div, returns the top-level table for that message in the thread. */
  export function containingTable(div) {
    return div.closest("div.M9");
  }

  /** Returns true if the given div is part of a new compose window
   *  (as opposed to a reply in a thread).
   */
  export function newCompose(div) {
    return div.closest(".AD").length > 0;
  }

  /** Finds the toolbar with the attach button and friends if it
   *  *isn't* inside the given div. This deals with the fact that
   *  there are at least two GMail UI variants in the wild:
   *
   *  - one where that menu only appears on hover
   *  - one where the menu is always there
   *
   *  The first one has the menu in a different place, which means it
   *  overlaps our new Esper toolbar (for inserting times and such).
   *
   *  Since the problem is that this on hover toolbar is not a child
   *  of the toolbar div, that's how we discriminate between the two
   *  cases. If it's the second case, this returns an empty selection.
   */
  export function mouseoverReplyToolbar(div) {
    var container = containingTable(div);

    if (div.parent().find("td.ZGHj2e.gU").length === 0) { // container for non-hover buttons
      return container.find(".eq"); // container for hover container
    } else {
      return $();
    }
  }

  /** Returns whether the currently focused cursor is in the given
   * GMail reply text field.
   */
  export function caretInField(field) {
    console.log(window.getSelection().anchorNode);
    return $(window.getSelection().anchorNode).closest(field).length > 0;
  }

  /*
    Get the font color used in the navigation bar, so we can use the same.
    This is nice when the user uses a custom dark background.
  */
  export function getNavbarTextColor() {
    var plusName = $(".gb_d.gb_f");
    if (plusName.length === 1)
      return plusName.css("color");
    else
      return "rgb(64, 64, 64)";
  }
}
