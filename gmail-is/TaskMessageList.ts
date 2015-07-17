module Esper.TaskMessageList {

  function renderMessage(selected, teamid, msg_inbox, msg_gid) {
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
    check.attr("id",  msg_gid);
    label.attr("for", msg_gid);

    Api.getGmailMessage(teamid, msg_inbox, msg_gid).done(function(msg) {
      sender .text(msg.message_sender);
      date   .text(msg.message_date);
      snippet.html(msg.message_snippet ? msg.message_snippet : "");

      check.prop("checked", List.mem(selected, msg.message_id));
      check.change(function() {
        if (check.prop("checked")) {
          if (! List.mem(selected, msg.message_id)) {
            selected.push(msg.message_id);
          }
        } else {
          var p = selected.indexOf(msg.message_id);
          if (p >= 0) {
            selected.splice(p, 1);
          }
        }
      });
    });
    return view;
  }

  export function render(taskid, selected, changed) {
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
      changed(selected);
      view.remove();
    }
    closeButton .click(closeView);
    closeButton2.click(closeView);

    Api.getTask(taskid, false, true).done(function(task) {
      List.iter(task.task_messages, function(msg) {
        list.append(renderMessage(selected, task.task_teamid,
                                  msg.message_owner,
                                  msg.message_gmsgid));
      });
    });
    return view;
  }
}
