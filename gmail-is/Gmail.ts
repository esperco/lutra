/*
  Extraction of data from the Gmail document and JavaScript environment.
*/

/// <reference path="./gmail.d.ts" />

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
    else {
      return anchor;
    }
  }

  export function findSidebarAnchor() {
    var anchor = $(".nH.g.id");

    if (anchor.length !== 1) {
      Log.d("Cannot find anchor point for the Esper sidebar.");
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

    if (div.parent().find("td.ZGHj2e.gU").length === 0) {
      // container for non-hover buttons
      return container.find(".eq"); // container for hover container
    } else {
      return $();
    }
  }

  /** Returns whether the currently focused cursor is in the given
   *  GMail reply text field.
   */
  export function caretInField(field) {
    return $(window.getSelection().anchorNode).closest(field).length > 0;
  }

  /*
    Get the font color used in the navigation bar, so we can use the same.
    This is nice when the user uses a custom dark background.
  */
  export function getNavbarTextColor() {
    var plusName = $(".gb_d.gb_f");
    if (plusName.length === 1) {
      return plusName.css("color");
    } else {
      return "rgb(64, 64, 64)";
    }
  }

  /** Opens up a reply dialog in the current thread, by clicking the
   *  forward link. We use the "forward" link instead of the "reply"
   *  link so that the recipients are not pre-filled incorrectly.
   *
   *  Optionally inserts the given HTML or text into the resulting
   *  text field.
   *
   *  If the reply field is already open, it should be focused and the
   *  given html will be inserted.
   */
  export function replyToThread(html?) {
    $(".amn").last().find("span").last().click();
    replyTextField(compositionToolbar().last()).focus();

    if (html) insertInFocusedField(html);
  }

  /** Inserts the given HTML or text into the currently focused input
   *  field.
   */
  export function insertInFocusedField(html) {
    // replace the selection (if any) at the caret:
    var selection = window.getSelection()
    var range     = selection.getRangeAt(0);

    html = "<span>" + html + "</span>";

    range.deleteContents();

    var node = $(html)[0];
    range.insertNode(node);
  }

  /** Returns the div that contains all the thread posts and
   *  composition controls.
   */
  export function threadContainer() {
    return $("div.Tm div.nH.aHU");
  }

  /* Inside threadContainer, the divs that contain message bodies have this
   * class. We're not returning a JQuery element because we'll use this as the
   * filtering selector for threadContainer().on().
   */
  export var messageTextSelector = ".a3s";

  /** The div containing information like % of inbox used and Google
   *  copyright notice at the bottom of the GMail thread. For whatever
   *  reason, this div seems to have extra padding set (right on the
   *  element, not from a stylesheet) at inopportune times.
   */
  export function threadFooter() {
    return $("div.l2.ov").first();
  }

  /** Given a proportion between 0 and 1, scrolls to that much of the
   *  thread. 0 scrolls to the top, 0.5 to the middle and 1 to the
   *  bottom.
   *
   *  The optional time argument specifies how long the animation
   *  should last, in milliseconds. The default is 500 milliseconds.
   */
  export function scrollThread(proportion: number, time?: number) {
    time = time || 500;
    var threadHeight = threadContainer().parent().height();

    $("div.Tm").animate({
      scrollTop :
        proportion * (threadHeight - $(window).height())
    }, time);
  }

  /** Scrolls the thread to show the bottom-most compose text box. */
  export function scrollToCompose(time?: number) {
    scrollToJQElm(InThreadControls.getHashTagContainer(), time);
  }

  /** Scrolls to the bottom of the thread to show the current event widget
   */
  export function scrollToEventControl(time?: number) {
    scrollToJQElm(InThreadControls.getEventControlContainer(), time);
  }

  /** Scrolls to a jQuery-wrapped element */
  export function scrollToJQElm(elm: JQuery, time?: number): void {
    time = time || 500;

    $("div.Tm").animate({
      scrollTop : elm.offset().top -
        $("div.Tm").children().first().offset().top
    }, time);
  }

  /** The div containing all the messages in a thread. In-thread
   *  controls are inserted after this div.
   */
  export function threadMessages() {
    return $("div.nH.aHU");
  }

  /*
  Produce separate functions for each event, making them typable since
    their callbacks have different types.

    specialize("unread") -> esperGmail.observe.unread.on(callback)
                            esperGmail.observe.unread.off()
  */
  var gmailJsSpecialize = function(name: string) {
    Esper.GmailJs.on[name] = function(callback) {
      Esper.GmailJs.observe.on(name, callback);
    };

    Esper.GmailJs.off[name] = function() {
      Esper.GmailJs.observe.off(name);
    };

    Esper.GmailJs.after[name] = function(callback) {
      Esper.GmailJs.observe.after(name, callback);
    };

    Esper.GmailJs.before[name] = function(callback) {
      Esper.GmailJs.observe.before(name, callback);
    };
  }

  /* Initializes the GmailJS library */
  export function init() {
    Esper.GmailJs = Esper.gmailJs(Esper.jQuery);
    Esper.GmailJs.on = <GmailJs.GmailJsOn> {};
    Esper.GmailJs.off = <GmailJs.GmailJsOff> {};
    Esper.GmailJs.after = <GmailJs.GmailJsAfter> {};
    Esper.GmailJs.before = <GmailJs.GmailJsBefore> {};

    // Specialization
    gmailJsSpecialize("unread");
    gmailJsSpecialize("read");
    gmailJsSpecialize("delete");
    gmailJsSpecialize("mark_as_spam");
    gmailJsSpecialize("mark_as_not_spam");
    gmailJsSpecialize("label");
    gmailJsSpecialize("archive");
    gmailJsSpecialize("move_to_inbox");
    gmailJsSpecialize("delete_forever");
    gmailJsSpecialize("delete_message_in_thread");
    gmailJsSpecialize("restore_message_in_thread");
    gmailJsSpecialize("star");
    gmailJsSpecialize("unstar");
    gmailJsSpecialize("mark_as_important");
    gmailJsSpecialize("mark_as_not_important");
    gmailJsSpecialize("filter_messages_like_these");
    gmailJsSpecialize("mute");
    gmailJsSpecialize("unmute");
    gmailJsSpecialize("add_to_tasks");
    gmailJsSpecialize("move_label");
    gmailJsSpecialize("save_draft");
    gmailJsSpecialize("discard_draft");
    gmailJsSpecialize("send_message");
    gmailJsSpecialize("expand_categories");
    gmailJsSpecialize("delete_label");
    gmailJsSpecialize("show_newly_arrived_message");
    gmailJsSpecialize("poll");
    gmailJsSpecialize("new_email");
    gmailJsSpecialize("refresh");
    gmailJsSpecialize("open_email");
    gmailJsSpecialize("reply_forward");
  }
}
