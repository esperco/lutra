module Esper.TaskMessageList {

  function renderMessage(teamid, msg_inbox, msg_gid) {
'''
<div #view class="esper-tl-task">
  <input #check type = "checkbox"/>
  <label #label>
    <span #sender class="esper-tl-task-title"></span>
    <span #date></span>
    <div #snippet></div>
  </label>
</div>
'''
    check.attr("id", msg_gid);
    label.attr("for", msg_gid);

    Api.getGmailMessage(teamid, msg_inbox, msg_gid).done(function(msg) {
      sender .text(msg.message_sender);
      date   .text(msg.message_date);
      snippet.html(msg.message_snippet ? msg.message_snippet : "");
    });
    return view;
  }

  export function render(taskid) {
'''
<div #view class="esper-tl-modal">
  <div class="esper-tl-task-list">
    <span #closeButton class="esper-tl-close esper-clickable">×</span>
    <div #list></div>
    <button #closeButton2 class="esper-btn esper-btn-primary modal-primary modal-cancel">
      Close
    </button>
  </div>
</div>
'''
    function closeView() {
      view.remove();
    }
    closeButton .click(closeView);
    closeButton2.click(closeView);

    Api.getTask(taskid, false, true).done(function(task) {
      List.iter(task.task_messages, function(msg) {
        list.append(renderMessage(task.task_teamid, msg.message_owner,
                                                    msg.message_gmsgid));
      });
    });
    return view;
  }
}
