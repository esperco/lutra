/*
  Attachment points and extraction for GMail, similar to Gcal.ts for
  calendar.
*/

module Esper.Gmail {
  
  /** Returns the tbody that contains the composition toolbar. This is
   *  the bar with the send button, the attachment tool and so on.
   */
  function compositionToolbar() {
    return $("\\:qd tbody");
  }
}