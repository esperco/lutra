/** Manages all the tools and buttons that appear above the compose
 *  text box for each message. Note that a single page/thread can have
 *  *more than one* text box because you can be simultaneously
 *  drafting replies for more than one message at a time. This module
 *  automatically manages every instance of the composition tools on
 *  the page.
 *
 *  This module also contains some basic utilities for interacting
 *  with the text box, like inserting text at the caret. Any future
 *  interactions of this sort should also go through here.
 *
 *  Currently, this does not appear for brand-new messages, just
 *  replies to messages in a thread. This will probably change in the
 *  future.
 */
module Esper.ComposeToolbar {

  var controlCallbacks = [];

  /** Given a callback that returns a JQuery element, executes the
   *  callback and inserts the resulting element into the toolbar each
   *  time a new reply interface is opened.
   *
   *  The callback gets an object as an argument with the following
   *  methods for interacting with the text box:
   *
   *    - insertAtCaret : JQuery -> unit
   *        Inserts the given HTML into the contenteditable element at
   *        the caret, replacing any selected text inside of it
   */
  export function registerControl(callback) {
    controlCallbacks.push(callback);
  }

  /** Given a set of elements (anchors for each text box), attaches
   *  the composition controls and sets up the event handlers to each
   *  one.
   */
  function attachControls(anchor: JQuery) {
    anchor.each(function (i, divElt) {
      var div = $(divElt);

      // If we haven't added a menu to this one yet and it is not a
      // "new thread" compose interface.
      if (!Gmail.newCompose(div) && div.children().length === 1) {

        // methods to control the current compose interface, passed into callback
        var composeInterface = {
          /** Inserts the given HTML string at the caret of a contenteditable
           *  element, replacing the current selection (if any).
           */
          insertAtCaret : function (html) {
            // focus on the correct text box:
            var textField = Gmail.replyTextField(div);
            textField.focus();            

            Gmail.insertInFocusedField(html);
          }
        };

        var container = toolbarContainer();
        div.prepend(container.bar);
        div.height(86);

        // Makes the toolbar fit on top of the existing GMail toolbar.
        var containing = Gmail.containingTable(div);
        containing.css("padding-bottom", 30);

        // Fix for overlapping menu; selection will be empty if this
        // is unnecessary
        var overlappingSpan = Gmail.mouseoverReplyToolbar(div);
        overlappingSpan.css("margin-top", 16);
        
        controlCallbacks.forEach(function (callback) {
          callback(composeInterface).match({
            none: function() {},
            some: function(element) {
              container.bar.append(element);
            }
          });
        });
      }
    });
  }

  /** Returns a _view that contains a styled toolbar for the
   *  composition interface, without any of the controls added in.
   */
  function toolbarContainer() {
'''
<div #bar class="esper-composition-toolbar esper-clearfix">
  <object #logo class="esper-composition-logo"/>
  <div class="esper-composition-vertical-divider"/>
</div>
'''
    logo.attr("data", Init.esperRootUrl + "img/footer-logo.svg");

    return _view;
  }

  /** Listens to the reply_forward event, which fires when somebody
   *  opens the textbox for replying to or forwarding a message in a
   *  thread and adds our controls to it.
   *
   */
  export function init() {
    GmailJs.on.reply_forward(function (match: JQuery, type: string) {
      var options = ExtensionOptions.store.val();
      var show = ExtensionOptions.ComposeControlsOpts.SHOW;
      if (options && options.displayComposeControls === show) {
        attachControls(Gmail.compositionToolbar());
      }
    });
  }
}
