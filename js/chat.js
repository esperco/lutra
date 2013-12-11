var chat = (function () {
  var mod = {};
  var profiles = {};

  function full_name(uid) {
    var p = profiles[uid];
    return p ? p.full_name : "someone";
  }

  function chat_participant_names(chat) {
    var me = login.me();
    var names = null;
    var someone_else = false;
    for (var i in chat.chat_participants) {
      var uid = chat.chat_participants[i].par_uid;
      if (uid !== me) {
        var p = profiles[uid];
        if (! p) {
          someone_else = true;
        } else if (names) {
          names += ", " + p.full_name;
        } else {
          names = p.full_name;
        }
      }
    }
    if (names) {
      return someone_else ? names + ", et al" : names;
    } else {
      return "participants";
    }
  }

  function viewOfSelectQuestion(sel) {
    var qs = $("<ol/>");
    for (var i in sel.sel_choices) {
      qs.append($("<li/>").append(sel.sel_choices[i].sel_label));
    }
    var v = $("<div/>");
    v.append(sel.sel_text);
    v.append(qs);
    return v;
  }

  function selectedAnswers(selected) {
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

  function viewOfCalendarSlot(slot) {
    var v = $("<li/>");
    v.append(date.range(date.ofString(slot.start), date.ofString(slot.end)));
    v.append($("<br/>"));
    v.append("Location: " + slot.location.title);
    return v;
  }

  function viewOfCalendarOptions(listRoot, calChoices) {
    for (var i in calChoices) {
      listRoot.append(viewOfCalendarSlot(calChoices[i].slot));
    }
    return listRoot;
  }

  function viewOfSchedulingQuestion(q) {
    var v = $("<div/>");
    v.append(q.body);
    v.append(viewOfCalendarOptions($("<ol/>", {type:"A"}), q.choices));
    return v;
  }

  function audioPlayer(audioLink) {
    return $("<audio/>", {src:audioLink, controls:true})
           .text("Left a voice message.");
  }

  function viewOfChatData(chat_item) {
    var kind = chat_item.chat_item_data[0];
    var data = chat_item.chat_item_data[1];
    switch (kind) {
    case "Message":
      return data;
    case "Audio":
      return audioPlayer(data);
    case "Selector_q":
      return viewOfSelectQuestion(data);
    case "Selector_r":
      return selectedAnswers(data.sel_selected);
    case "Scheduling_q":
      return viewOfSchedulingQuestion(data);
    case "Scheduling_r":
      return viewOfCalendarOptions($("<ul/>"), data.selected);
    case "Sched_confirm":
    case "Sched_remind":
      return data.body;
    default:
      return $("<i/>").append(kind);
    }
  }

  function viewOfChatItem(item, time, status) {
    var v = $("<div/>");
    v.append($("<div/>").append(full_name(item.by)));
    v.append($("<div/>").append(date.viewTimeAgo(date.ofString(time))));
    v.append($("<div/>").append(status));
    v.append($("<div/>").append(viewOfChatData(item)));
    v.append($("<hr/>"));
    return v;
  }

  function statusOfChatItem(item) {
    return item.time_read ? "Read" : "Posted";
  }

  function editChoiceOption() {
    var edit = $("<input/>", {placeholder:"Add option."});
    var v = $("<li/>");
    v.append(edit);

    edit.keydown(function (e) {
      switch (e.which) {
      case 13:
        if (edit.val() !== "") {
          var li = editChoiceOption();
          v.after(li);
          li.find("input").focus();
        }
        return false;

      case 8:
      case 46:
        if (edit.val() === "" && 1 < v.parent().children().length) {
          v.prev().find("input").focus();
          v.remove();
          return false;
        } else {
          return true;
        }

      default:
        return true;
      }
    });

    return v;
  }

  function editChoices() {
    var v = $("<ul/>");
    var opt1 = editChoiceOption();
    opt1.find("input").val("Option 1");
    v.append(opt1);
    v.append(editChoiceOption());
    return v;
  }

  function selector_q_data(text, choices) {
    var sel = [];
    choices.find("input").each(function(i,ed) {
      if (ed.value !== "") {
        sel.push({sel_label:ed.value});
      }
    });
    return 0 < sel.length
         ? ["Selector_q", {sel_text:text,
                           sel_multi:false,
                           sel_choices:sel,
                           sel_default:[]}]
         : null;
  }

  function message_data(text) {
    return "" === text ? null : ["Message", text];
  }

  function chatEditor(chat) {
    var v = $("<div/>");

    v.append($("<b>To:</b>"));
    v.append(" " + chat_participant_names(chat));

    var editText = $("<textarea/>", {placeholder:"Write a reply..."});
    v.append($("<div/>").append(editText));

    var choicesEditor = editChoices();
    choicesEditor.hide();
    v.append(choicesEditor);

    var selChoices = $("<input/>", {type:"checkbox"});
    selChoices.click(function () {
      choicesEditor.toggle();
    });
    var selChoicesLabel = $("<label/>");
    selChoicesLabel.append(selChoices);
    selChoicesLabel.append("Offer multiple choice response.");

    var sendButton = $("<button>Send</button>");
    sendButton.click(function () {
      var data = selChoices.prop("checked")
               ? selector_q_data(editText.val(), choicesEditor)
               : message_data(editText.val());
      if (data) {
        var me = login.me();
        var item = {
          chatid: chat.chatid,
          by: me,
          for: me,
          chat_item_data:data
        };
        var tempItemView = viewOfChatItem(item, Date.now(), "Posting");
        v.before(tempItemView);
        editText.val("");
        api.postChatItem(item).done(function(item) {
            var itemView = viewOfChatItem(item, item.time_created,
                                          statusOfChatItem(item));
            tempItemView.replaceWith(itemView);
        });
      }
    });

    var buttons = $("<div/>");
    buttons.append(selChoicesLabel);
    buttons.append(sendButton);
    v.append(buttons);

    return v;
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
      v.append(viewOfChatItem(item, item.time_created, status));
    }

    v.append(chatEditor(chat));
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
