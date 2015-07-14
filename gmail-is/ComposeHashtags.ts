module Esper.ComposeHashtags {

  function hashtagView(textViews) {
'''
  <div #view class="esper-ev-modal-row esper-clearfix">
    * <input #text class="esper-input"/> <button #remove>X</button>
  </div>
'''
    textViews.push(text);
    remove.click(function () {
      textViews.splice(textViews.indexOf(text), 1);
      view.remove();
    });
    return view;
  }

  function message(question, hashtagTextViews) {
    var conv = $("<span/>");
    var message = conv.text(question).html() + "\n<p>";
    List.iter(hashtagTextViews, function(view:JQuery) {
      var s = view.val().trim();
      if (s.length > 0) {
        s = s.match(/^\w+$/) ? "#" + s
                             : "#(" + s + ")";
        message += conv.text(s).html() + "<br>\n";
      }
    });
    return message + "</p>";
  }

  export function view(composeControls) {
'''
<div #view class="esper-centered-container">
  <div #inline>
    <div class="esper-modal-header">
      <div #title class="esper-modal-title">Ask Exec</div>
    </div>
    <div class="esper-ev-modal-row esper-clearfix">
      Question: <input #question class="esper-input"/>
    </div>
    <div #hashtags class="esper-calendar-grid"/>
    <button #addTag class="esper-btn esper-btn-secondary">Add</button>
    <div class="esper-modal-footer esper-clearfix">
      <button #cancel class="esper-btn esper-btn-secondary">
        Cancel
      </button>
      <button #ask class="esper-btn esper-btn-primary">
        Ask
      </button>
    </div>
  </div>
</div>
'''
    var hashtagTextViews = [];

    addTag.click(function() {
      hashtags.append(hashtagView(hashtagTextViews));
    });

    cancel.click(function() {
      view.remove();
    });

    ask.click(function() {
      composeControls.insertAtCaret(message(question.val(), hashtagTextViews));
      view.remove();
    });

    hashtags.append(hashtagView(hashtagTextViews));
    hashtags.append(hashtagView(hashtagTextViews));
    return view;
  }
}
