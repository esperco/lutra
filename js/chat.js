var chat = (function () {
  var mod = {};
  var profiles = {};

  function full_name(uid) {
    var p = profiles[uid];
    return p ? p.full_name : "John Doe";
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
    var v = $("<li class='option'/>");
    var radio = $("<img class='option-radio'/>");
    radio.appendTo(v);
    svg.loadImg(radio, "/assets/img/radio.svg");

    var editDiv = $("<div class='options-input-div'/>")
    var edit = $("<input class='form-control options-input'/>", {placeholder:"Add option."});
    editDiv.append(edit);
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
    var v = $("<li class='option'/>");
    var radio = $("<img class='option-radio add-option-radio'/>");
    radio.appendTo(v);
    svg.loadImg(radio, "/assets/img/radio.svg");

    var button = $("<button class='add-option-btn'>Click to add option</button>");
    button.click(function() {
      var li = editChoiceOption();
      v.before(li);
      li.find("input").focus();
    });
    v.append(button);
    return v;
  }

  function editChoices() {
    var v = $("<ul class='option-list'/>");
    var opt1 = editChoiceOption();
    opt1.find("input").focus();
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

  function chatEditor(chat, task) {
    var chatFooter = $("<div class='navbar-fixed-bottom col-md-4 chat-footer'/>");

    if (chat.chatid === task.task_context_chat) {
      var toField = $("<div class='to-field'/>")
        .appendTo(chatFooter);
      toField.append($("<b>To:</b>"));
      toField.append(" " + chat_participant_names(chat));
    }

    var v = $("<div class='chat-editor'/>")
      .appendTo(chatFooter);

    var editText = $("<textarea/>", {
      'class': "form-control chat-entry",
      'placeholder': "Write a reply..."
    });
    editText.on("keyup", function (e){
      $(this).css("height", "auto");
      $(this).height(this.scrollHeight);
    });
    editText.keyup();
    editText.appendTo(v);

    var choicesEditor = editChoices();
    choicesEditor.hide();
    v.append(choicesEditor);

    var chatActions = $("<div class='chat-actions clearfix hide'/>")
      .appendTo(v);
    editText.focus(function () {
      chatActions.removeClass("hide");
    })

    var selChoicesDiv = $("<div class='col-xs-10 offer-choices'/>")
      .appendTo(chatActions);
    var sendDiv = $("<div class='col-xs-2 chat-send'/>")
      .appendTo(chatActions);

    var selChoices = $("<img class='offer-choices-checkbox'/>");
    selChoicesDiv.append(selChoices);
    svg.loadImg(selChoices, "/assets/img/checkbox.svg");
    var selChoicesLabel = $("<div/>", {
      'class': "offer-choices-label unselectable",
      'text': "Offer multiple choice response."
    });
    selChoicesDiv.append(selChoicesLabel);

    selChoicesDiv.click(function () {
      if (selChoicesDiv.hasClass("checkbox-selected")) {
        selChoicesDiv.removeClass("checkbox-selected");
      } else {
        selChoicesDiv.addClass("checkbox-selected");
      }
      choicesEditor.toggle();
    });

    var sendButton = $("<button class='btn btn-primary chat-send-btn disabled'>Send</button>")
      .appendTo(sendDiv);

    function isValidMessage(s) {
      return s.length > 0;
    }

    editText.val("");
    util.afterTyping(editText, $(".chat-entry"), function () {
      if (isValidMessage(editText.val()))
        sendButton.removeClass("disabled");
    });

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

  function chatView(chat, task) {
    var me = login.me();
    var v = $("<div/>");

    var displayName = $("<div class='chat-profile-details'></div>")
      .appendTo(v);
    if (chat.chatid === task.task_context_chat) {
      displayName.append("Original Email");
    } else {
      displayName.append(chat_participant_names(chat));
    }

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

    v.append($("<div class='chat-push'/>"));
    v.append(chatEditor(chat, task));
    v.scroll(0, v.height); /* trying to auto scroll to bottom */

    return v;
  }

  $("#chat-footer").onresize = function adjustPush() {
      var footerHeight = $("chat-footer").height();
      $(".chat-push").attr('style', 'height:' + footerHeight + 'px');
  };

  mod.loadTaskChats = function(task) {
    $(".chat-profile-tabs li").remove();
    var tabs = $(".chat-profile-tabs");
    $(".chat-panel div").remove();
    var tab_content = $(".chat-panel");

    profile.mget(task.task_participants.organized_for)
      .done(function(profs) {
        list.iter(profs, function (p) {
          profiles[p.prof.profile_uid] = p.prof;
        });

        list.iter(task.task_chats, function (chat) {
          var tab_name;
          var pane_id = "chat" + chat.chatid;
          var tab = $("<a/>", {href:"#"+pane_id, "class":"tab-name", "data-toggle":"tab"});
          tabs.append($("<li class='chat-tab-div'/>")
              .append(tab));
          if (chat.chatid === task.task_context_chat) {
            $(".chat-tab-div").addClass("active");
            var group = $("<img class='group'/>");
            tab.append($("<div class='prof-circ'/>")
               .append(group));
            svg.loadImg(group, "/assets/img/group.svg");
          } else {
            var p = profiles[chat.chat_participants[0].par_uid];
            tab_name = p.full_name;
            var tab_initial = p.full_name.charAt(0).toUpperCase();
            tab.append($("<div class='prof-circ'/>")
               .append(tab_initial));
          }
          var caret = $("<img class='prof-caret'/>");
          caret.appendTo(tab);
          svg.loadImg(caret, "/assets/img/caret.svg");
          tab_content.append($("<div/>", {id:pane_id, "class":"tab-pane"})
                     .append(chatView(chat, task)));
        });

        $("#chat").removeClass("hide");
      });
  }

  return mod;
}());
