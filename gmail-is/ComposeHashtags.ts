module Esper.ComposeHashtags {

  function hashtagView(textViews) {
'''
  <div #view class="esper-ev-modal-row esper-clearfix esper-flex-row ">
    <label #label class="esper-left-label">Choice</label>
    <input #text class="esper-input esper-flex-expand"/>
    <button class="esper-remove-btn" #remove />
  </div>
'''
    var randomId = Util.randomString();
    text.attr("id", randomId);
    label.attr("for", randomId);
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
    <div class="esper-modal-content">
      <div class="esper-ev-modal-row esper-clearfix esper-flex-row">
        <label class="esper-left-label"
               for="esper-ask-exec-question">Question</label>
        <input #question id="esper-ask-exec-question"
               class="esper-input esper-flex-expand"/>
      </div>
      <div #hashtags class="esper-calendar-grid"/>
      <button #addTag class="esper-btn esper-btn-secondary">Add Choice</button>
    </div>
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
