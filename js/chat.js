var chat = (function () {
  var mod = {};
  var profiles = {};

  mod.postChatItem = function(item) {
    task.onChatPosting.notify(item);
    return api.postChatItem(item).done(task.onChatPosted.notify);
  }

  function full_name(uid) {
    var p = profiles[uid].prof;
    return p ? p.full_name : "John Doe";
  }

  function chat_participant_names(chat) {
    var me = login.me();
    var names = null;
    var someone_else = false;
    for (var i in chat.chat_participants) {
      var uid = chat.chat_participants[i].par_uid;
      if (uid !== me) {
        var p = profiles[uid].prof;
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
      return someone_else ? names + ", and others" : names;
    } else {
      return "Guest";
    }
  }

  function viewOfChatText(text) {
    var view = $("<div/>");
    var paragraphs = text.split(/\n{2,}/);
    for (var ip in paragraphs) {
      var p = $("<p/>");
      var lines = paragraphs[ip].split(/\n/);
      if (0 < lines.length) {
        p.text(lines[0]);
        for (var il = 1; il < lines.length; ++il) {
          p.append("<br/>");
          p.append(document.createTextNode(lines[il]));
        }
      }
      view.append(p);
    }
    return view;
  }

  function viewOfSelectQuestion(sel) {
    var qs = $("<ol/>");
    for (var i in sel.sel_choices) {
      qs.append($("<li/>").text(sel.sel_choices[i].sel_label));
    }
    var v = viewOfChatText(sel.sel_text);
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
    v.text(date.range(date.ofString(slot.start), date.ofString(slot.end)));
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
    var v = viewOfChatText(q.body);
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
      return viewOfChatText(data);
    case "Audio":
      return audioPlayer(data);
    case "Selector_q":
      return viewOfSelectQuestion(data);
    case "Selector_r":
      return $("<span/>").text(selectedAnswers(data.sel_selected));
    case "Scheduling_q":
      return viewOfSchedulingQuestion(data);
    case "Scheduling_r":
      return viewOfCalendarOptions($("<ul/>"), data.selected);
    case "Sched_confirm":
    case "Sched_remind":
      return viewOfChatText(data.body);
    default:
      return $("<i/>").text(kind);
    }
  }

  function viewOfChatItem(item, time, status) {
    var v = $("<div/>");
    var header = $("<div class='message-header clearfix' />")
      .appendTo(v);

    var name = $("<div class='col-xs-6 from-name-div' />")
      .appendTo(header);
    name.append(
      $("<div class='from-name' />")
        .append(full_name(item.by))
    );

    var timestamp = $("<div class='col-xs-6 timestamp-div' />")
      .appendTo(header);
    timestamp
      .append($("<div class='timestamp' />")
              .append(date.viewTimeAgo(date.ofString(time))));

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
    var radio = $("<div class='option-radio'/>")
      .appendTo(v);

    var editDiv = $("<div class='options-input'/>");
    var edit = $("<input class='form-control'/>")
      .appendTo(editDiv);
    v.append(editDiv);

    edit.keyup(function (e) {
      switch (e.which) {
      case 13:
        if (edit.val() !== "") {
          var li = editChoiceOption();
          removeChoiceOption(li);
          v.after(li);
          li.find("input").focus();
        }
        return false;

      case 8:
      case 46:
        if (edit.val() === "" && 2 < v.parent().children().length) {
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

  function removeChoiceOption(li) {
    var deleteDiv = $("<div/>");
    var x = $("<img class='option-delete'/>")
        .appendTo(deleteDiv);
    svg.loadImg(x, "/assets/img/delete.svg");

    deleteDiv.click(function() {
      li.prev().find("input").focus();
      li.remove();
    });

    deleteDiv.appendTo(li);
  }

  function buttonToAddChoiceOption() {
    var v = $("<li class='option'/>");
    var emptyRadio = $("<div class='option-radio add-option-radio'/>");
    emptyRadio.appendTo(v);

    var button = $("<button class='add-option-btn'>Click to add option</button>");
    button.click(function() {
      var li = editChoiceOption();
      removeChoiceOption(li);
      v.before(li);
      li.find("input").focus();
    });

    v.append(button);

    return v;
  }

  function editChoices() {
    var v = $("<ul class='option-list'/>");
    var opt1 = editChoiceOption()
      .appendTo(v);
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

  function chatEditor(messages, chat, task) {
    var chatFooter = $("<div class='chat-footer scrollable'/>");

    var editText = $("<textarea class='form-control chat-entry'></textarea>")
      .appendTo(chatFooter);

    editText.autosize();

    if (chat.chat_items.length === 0) {
      editText.attr("placeholder", "Write a message...");
    } else {
      editText.attr("placeholder", "Write a reply...");
    }

    editText.val("");

    var choicesEditor = editChoices();
    choicesEditor.hide();
    chatFooter.append(choicesEditor);

    var chatActions = $("<div class='chat-actions clearfix'/>")
      .appendTo(chatFooter);
    var selChoicesDiv = $("<div class='col-xs-10 offer-choices'/>")
      .appendTo(chatActions);
    var sendDiv = $("<div class='col-xs-2 chat-send'/>")
      .appendTo(chatActions);

    var selChoices = $("<img class='offer-choices-checkbox'/>");
    selChoicesDiv.append(selChoices);
    svg.loadImg(selChoices, "/assets/img/checkbox-sm.svg");
    var selChoicesLabel = $("<div/>", {
      'class': "offer-choices-label unselectable",
      'text': "Offer multiple choice response."
    });
    selChoicesDiv.append(selChoicesLabel);

    selChoicesDiv.click(function () {
      if (selChoicesDiv.hasClass("checkbox-selected")) {
        selChoicesDiv.removeClass("checkbox-selected");
        util.cancelFocus();
      } else {
        selChoicesDiv.addClass("checkbox-selected");
        var first = choicesEditor.children().eq(0).find("input");
        util.changeFocus(first);
      }
      choicesEditor.toggle();
      util.focus();
    });

    var sendButton = $("<button/>")
      .addClass('btn btn-primary chat-send-btn disabled')
      .text("Send")
      .appendTo(sendDiv);

    editText.on("keydown", function (e){
      log("Here1");
      if ($(this).val() !== "") {
        log("Here2");
        sendButton.removeClass("disabled");
      } else {
        log("Here3");
        sendButton.addClass("disabled");
      }
    });

    sendButton.click(function () {
      var data = selChoicesDiv.hasClass("checkbox-selected")
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
        editText.val("");
        editText.attr("placeholder", "Write a reply...");

        if (selChoicesDiv.hasClass("checkbox-selected")) {
          choicesEditor.toggle();
          selChoicesDiv.removeClass("checkbox-selected");
          var numOptions = choicesEditor.children().length-1;
          if (numOptions > 1) {
            for (var i=numOptions-1; i>0; i--) {
              choicesEditor.children().eq(i).remove();
            }
          }
        }

        mod.postChatItem(item);
      }
    });

    return chatFooter;
  }

  var tempItemView;

  function chatPosting(item) {
    var view = $("#chat" + item.chatid + " .messages");
    if (0 < view.length) {
      tempItemView = viewOfChatItem(item, Date.now(), "Posting");
      view.append(tempItemView);
    }
  }

  function chatPosted(item) {
    if (tempItemView) {
      var itemView = viewOfChatItem(item, item.time_created,
                                    statusOfChatItem(item));
      tempItemView.replaceWith(itemView);
      tempItemView = null;
    }
  }

  function chatView(chat, task) {
    var me = login.me();
    var v = $("<div/>");

    var displayName = $("<div class='chat-profile-details'></div>")
      .appendTo(v);
    if (chat.chatid === task.task_context_chat) {
      displayName.append("Group Conversation");
    } else {
      displayName.append(chat_participant_names(chat));
    }

    var messages = $("<div class='messages scrollable'></div>")
      .appendTo(v);

    if (chat.chat_items.length === 0) {
      var blank = $("<div class='blank-chat'></div>")
        .appendTo(messages);
      var blankChatIcon = $("<img class='blank-chat-icon'/>")
        .appendTo(blank);
      svg.loadImg(blankChatIcon, "/assets/img/chat.svg");
      blank.append("Start the conversation below.");
    } else {
      for (var i in chat.chat_items) {
        var item = chat.chat_items[i];
        var status;
        if (! item.time_read && item.id && me !== item.by) {
          api.postChatItemRead(item.chatid, item.id);
          status = "Read";
        } else {
          status = statusOfChatItem(item);
        }
        messages.append(viewOfChatItem(item, item.time_created, status));
      }
    }

    if (chat.chatid === task.task_context_chat) {
      var toField = $("<div class='to-field'/>")
        .appendTo(v);
      toField.append($("<b>To:</b>"));
      toField.append(" " + chat_participant_names(chat));
      messages.addClass("group-chat");
    }

    v.append(chatEditor(messages, chat, task));

    return v;
  }

  mod.clearTaskChats = function() {
    $(".chat-profile-tabs li").remove();
    $(".chat-panel div").remove();
  }

  mod.loadTaskChats = function(ta) {
    mod.clearTaskChats();

    $("#chat-icon-container").click(function() {
      if ($("#chat").hasClass("fadeOutRight")) {
        $("#chat").removeClass("fadeOutRight")
                  .addClass("fadeInRight");
      } else {
        $("#chat").addClass("fadeOutRight")
                  .removeClass("fadeInRight premiere");
      }
    });

    var tabs = $(".chat-profile-tabs");
    var tab_content = $(".chat-panel");

    task.profilesOfEveryone(ta)
      .done(function(profs) {
        profiles = profs;

        var first_tab = true;

        /* move group chat to first position */
        var singleChats = list.filter(ta.task_chats, function(x) {
          return x.chatid !== ta.task_context_chat;
        });
        var groupChats = list.filter(ta.task_chats, function(x) {
          return x.chatid === ta.task_context_chat;
        });
        var chats = list.concat([groupChats, singleChats]);

        list.iter(chats, function(chat) {
          var isGroupChat = chat.chatid === ta.task_context_chat;
          var peerUid = chat.chat_with;
          var taskParticipants =
            ta.task_participants.organized_for
            .concat(ta.task_participants.organized_by);

          /* Do not display a chat tab for former participants */
          if (! isGroupChat
              && ! list.mem(taskParticipants, peerUid))
            return;

          var pane_id = "chat" + chat.chatid;
          var tab = $("<a/>", {
            href:"#"+pane_id,
            "class":"tab-name",
            "data-toggle":"tab",
          });
          tabs.append($("<li class='chat-tab-div'/>")
              .append(tab));
          tab_content.append($("<div/>", {id:pane_id, "class":"tab-pane"})
                     .append(chatView(chat, ta)));
          if (isGroupChat) {
            var group = $("<img class='group'/>");
            tab.tooltip({"title":"Group Conversation","placement":"bottom"})
               .append($("<div class='chat-prof-circ'/>")
               .append(group));
            svg.loadImg(group, "/assets/img/group.svg");
          } else {
            if (! util.isDefined(peerUid))
              peerUid = chat.chat_participants[0].par_uid;
            var p = profiles[peerUid].prof;
            var tab_initials = profile.veryShortNameOfProfile(p);
            tab.tooltip({"title":p.full_name,"placement":"bottom"})
               .append($("<div class='chat-prof-circ'/>")
               .append(tab_initials));
          }
          var caret = $("<img class='prof-caret'/>");
          caret.appendTo(tab);
          svg.loadImg(caret, "/assets/img/prof-caret.svg");
          if (first_tab) {
            $(".chat-tab-div").addClass("active");
            $("#" + pane_id).addClass("active");
            first_tab = false;
          }
        });

        task.onChatPosting.observe("chat-tabs", chatPosting);
        task.onChatPosted .observe("chat-tabs", chatPosted );
      });
  }

  return mod;
}());
