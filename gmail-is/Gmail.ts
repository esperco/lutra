/*
  Extraction of data from the Gmail document and JavaScript environment.
*/

module Esper.Gmail {

  export function findSidebarAnchor() {
    var anchor = $(".nH.g.id");

    if (anchor.length !== 1) {
      Log.e("Cannot find anchor point for the Esper thread controls.");
      return $();
    } else {
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
}
