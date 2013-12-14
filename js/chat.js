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

  function appendLocation(elt, loc) {
    var locText = sched.locationText(loc);
    if (locText) {
      $("<span/>")
        .text("Location: " + locText)
        .appendTo(elt);
    }
  }

  function viewOfCalendarSlot(slot) {
    var v = $("<li/>");
    v.append(date.range(date.ofString(slot.start), date.ofString(slot.end)));
    v.append($("<br/>"));
    appendLocation(v, slot.location);
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
    var header = $("<div class='message-header clearfix' />")
      .appendTo(v);

    var name = $("<div class='col-xs-6 from-name-div' />")
      .appendTo(header);
    name.append($("<div class='from-name' />").append(full_name(item.by)));

    var timestamp = $("<div class='col-xs-6 timestamp-div' />")
      .appendTo(header);
    timestamp.append($("<div class='timestamp' />").append(date.viewTimeAgo(date.ofString(time))));

    v.append($("<div class='message'/>").append(viewOfChatData(item)));
    // v.append($("<div class='message-status' />").append(status));
    v.append($("<hr/>"));
    return v;
  }

  function statusOfChatItem(item) {
    return item.time_read ? "Read" : "Posted";
  }

  function editChoiceOption() {
    var v = $("<li id='option' />");
    var radio = $("<img id='options-radio' class='esper-radio'/>");
    radio.appendTo(v);
    svg.loadImg(radio, "/assets/img/radio.svg");

    var editDiv = $("<div id='options-input-div' />")
    var edit = $("<input id='options-input' class='form-control' />", {placeholder:"Add option."});
    editDiv.append(edit)
    v.append(editDiv);

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

  function buttonToAddChoiceOption() {
    var v = $("<li id='option' />");
    var radio = $("<img id='options-radio' class='esper-radio'/>");
    radio.appendTo(v);
    svg.loadImg(radio, "/assets/img/radio.svg");

    var button = $("<button class='add-option'>Click to add option</button>");
    button.click(function() {
      var li = editChoiceOption();
      v.before(li);
      li.find("input").focus();
    });
    v.append(button);
    return v;
  }

  function editChoices() {
    var v = $("<ul id='options' />");
    var opt1 = editChoiceOption();
    opt1.find("input").val("Option 1");
    v.append(opt1);
    v.append(buttonToAddChoiceOption());
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
    var chatFooter = $("<div id='chat-footer' class='navbar-fixed-bottom col-md-4' />");

    var toField = $("<div id='to-field' />")
      .appendTo(chatFooter);
    toField.append($("<b>To:</b>"));
    toField.append(" " + chat_participant_names(chat));

    var v = $("<div id='chat-editor' />")
      .appendTo(chatFooter);

    var editText = $("<textarea/>", {
      'id': "chat-entry",
      'class': "form-control",
      'placeholder': "Write a reply..."
    });
    // editText.click(function () {
    // })
    editText.appendTo(v);

    var choicesEditor = editChoices();
    choicesEditor.hide();
    v.append(choicesEditor);

    var chatActions = $("<div id='chat-actions' class='clearfix' />")
      .appendTo(v);
    var selChoicesDiv = $("<div id='offer-choices' class='col-xs-10' />")
      .appendTo(chatActions);
    var sendDiv = $("<div id='chat-send' class='col-xs-2' />")
      .appendTo(chatActions);

    var selChoices = $("<img id='offer-choices-checkbox' class='esper-checkbox'/>");
    selChoicesDiv.append(selChoices);
    svg.loadImg(selChoices, "/assets/img/checkbox.svg");
    var selChoicesLabel = $("<div/>", {
      'id': "offer-choices-label",
      'class': "unselectable",
      'text': "Offer multiple choice response."
    });
    selChoicesDiv.append(selChoicesLabel);

    selChoicesDiv.click(function () {
      choicesEditor.toggle();
      // if (selChoices.hasClass("esper-checkbox-selected") {
      //   selChoices.removeClass("esper-checkbox-selected");
      // } else {
      //   selChoices.addClass("esper-checkbox-selected");
      // }
    });

    var sendButton = $("<button id='chat-send-btn' class='btn btn-primary'>Send</button>")
      .appendTo(sendDiv);
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

    return chatFooter;
  }

  function chatView(chat) {
    var me = login.me();
    var v = $("<div class='test'/>");

    v.append(chatEditor(chat));

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

    var push = $("<div id='chat-push' />")
      .appendTo(v);

    $("#chat-panel").scrollTop(9999999);
    var scroll = $("#chat-panel").scrollTop();
    log("scrollTop: " + scroll);

    return v;
  }

  $("#chat-footer").onresize = function adjustPush() {
      var footerHeight = $("chat-footer").height();
      $("#chat-push").attr('style', 'height:' + footerHeight + 'px');
  };

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
          var pane_id = "chat" + chat.chatid;
          var tab = $("<a/>", {href:"#"+pane_id, "id":"tab-name", "data-toggle":"tab"});
          if (chat.chatid === task.task_context_chat) {
            tabs.append($("<li id='chat-tab-div' />")
              .append(tab));
            var group = $("<img id='group'/>");
            group.appendTo(tab);
            svg.loadImg(group, "/assets/img/group.svg");
          } else {
            var p = profiles[chat.chat_participants[0].par_uid];
            tab_name = p.full_name.charAt(0).toUpperCase();
            tabs.append($("<li id='chat-tab-div' />")
              .append(tab));
            tab.append($("<div id='prof-circ' />")
             .append(tab_name));
          }
          tab_content.append($("<div/>", {id:pane_id, "class":"tab-pane"})
                     .append(chatView(chat)));
        });

        $("#chat").removeClass("hide");
      });
  }

  return mod;
}());
