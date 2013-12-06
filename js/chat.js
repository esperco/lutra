var chat = (function () {
  var mod = {};
  var profiles = {};

  function full_name(uid) {
    var p = profiles[uid];
    return p ? p.full_name : "someone";
  }

  function selectedText(selected) {
    var sel = null;
    for (var i in selected) {
      if (sel) {
        sel += ", " + selected[i];
      } else {
        sel = selected[i];
      }
    }
    return sel;
  }

  function audioPlayer(audioLink) {
    return $("<audio/>", {src:audioLink, controls:true})
           .text("Left a voice message.");
  }

  function chatText(chat_item) {
    var kind = chat_item.chat_item_data[0];
    var data = chat_item.chat_item_data[1];
    switch (kind) {
    case "Message":
      return data;
    case "Audio":
      return audioPlayer(data);
    case "Selector_q":
      return data.sel_text;
    case "Selector_r":
      return selectedText(data.sel_selected);
    case "Scheduling_q":
      return $("<i/>").append("Asked for the schedule.");
    case "Scheduling_r":
      return $("<i/>").append("Answered the schedule.");
    case "Sched_confirm":
      return data.body;
    default:
      return $("<i/>").append(kind);
    }
  }

  function viewOChatItem(item, time, status) {
    var v = $("<div/>");
    v.append($("<div/>").append(full_name(item.by)));
    v.append($("<div/>").append(date.viewTimeAgo(date.ofString(time))));
    v.append($("<div/>").append(status));
    v.append($("<div/>").append(chatText(item)));
    v.append($("<hr/>"));
    return v;
  }

  function statusOfChatItem(item) {
    return item.time_read ? "Read" : "Posted";
  }

  function chatView(chat) {
    var me = login.me();
    var v = $("<div/>");

    for (var i in chat.chat_items) {
      var item = chat.chat_items[i];
      var status;
      if (! item.time_read && item.id && me !== item.by) {
        api.postChatItemRead(item.chatid, item.id);
        status = "Read";
      } else {
        status = statusOfChatItem(item);
      }
      v.append(viewOChatItem(item, item.time_created, status));
    }

    var edit = $("<input/>", {placeholder:"Write a reply..."});
    edit.keypress(function (e) {
      if (13 === e.which) {
        if (edit.val() !== "") {
          var item = {
            chatid: chat.chatid,
            by: me,
            for: me,
            chat_item_data:["Message", edit.val()]
          };
          var tempItemView = viewOChatItem(item, Date.now(), "Posting");
          edit.before(tempItemView);
          edit.val("");
          api.postChatItem(item).done(function(item) {
            var itemView = viewOChatItem(item, item.time_created,
                                         statusOfChatItem(item));
            tempItemView.replaceWith(itemView);
          });
        }
        return false;
      } else {
        return true;
      }
    });
    v.append(edit);

    return v;
  }

  mod.loadTaskChats = function(task) {
    $("#chat-profile-tabs li").remove();
    var tabs = $("#chat-profile-tabs");
    $("#chat-panel div").remove();
    var tab_content = $("#chat-panel");

    profile.mget(task.task_participants.organized_for)
      .done(function(profs) {
        list.iter(profs, function (p) {
          profiles[p.prof.profile_uid] = p.prof;
        });

        list.iter(task.task_chats, function (chat) {
          var tab_name;
          if (chat.chatid === task.task_context_chat) {
            tab_name = "Origin";
          } else {
            var p = profiles[chat.chat_participants[0].par_uid];
            tab_name = p.full_name;
          }
          var pane_id = "chat" + chat.chatid;
          tabs.append($("<li/>")
              .append($("<a/>", {href:"#"+pane_id, "data-toggle":"tab"})
              .append(tab_name)));
          tab_content.append($("<div/>", {id:pane_id, "class":"tab-pane"})
                     .append(chatView(chat)));
        });

        $("#chat").removeClass("hide");
      });
  }

  return mod;
}());
