var chat = (function () {
  var mod = {};
  var profiles = {};

  mod.postChatItem = function(item) {
    observable.onChatPosting.notify(item);
    return api.postChatItem(item).done(observable.onChatPosted.notify);
  }

  function full_name(uid) {
    var p = profiles[uid].prof;
    return p ? profile.fullName(p) : "John Doe";
  }

  function initials(uid) {
    var p = profiles[uid].prof;
    return profile.veryShortNameOfProfile(p);
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

  function viewOfComplexMessage(fullText, optShortText) {
    var view = $("<div/>");
    var fullDiv = viewOfChatText(fullText);
    if (util.isString(optShortText)) {
      var shortDiv = viewOfChatText(optShortText);
      var full = true;
      var toggle = $("<a href='#'/>");
      function onClick() {
        if (full) {
          fullDiv.addClass("hide");
          shortDiv.removeClass("hide");
          full = false;
          toggle.text("- show quoted text -");
        } else {
          fullDiv.removeClass("hide");
          shortDiv.addClass("hide");
          full = true;
          toggle.text("- hide quoted text -");
        }
        return false;
      }
      toggle.click(onClick);
      onClick();
      view
        .append(shortDiv)
        .append(toggle)
        .append(fullDiv);

    } else {
      view.append(fullDiv);
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

  mod.locationText = function(loc) {
    if (loc.address) {
      if (loc.instructions)
        return loc.address + " (" + loc.instructions + ")";
      else
        return loc.address;
    }
    else if (loc.title)
      return loc.title;
    else if (loc.instructions)
      return loc.instructions;
    else
      return "";
  }

  function appendLocation(elt, loc) {
    var locText = mod.locationText(loc);
    if (locText) {
      $("<span/>")
        .text("Location: " + locText)
        .appendTo(elt);
    }
  }

  function viewOfCalendarSlot(slot, hideEndTime) {
    var v = $("<li/>");
    if (hideEndTime)
      v.text(date.justStartTime(date.ofString(slot.start)));
    else
      v.text(date.range(date.ofString(slot.start), date.ofString(slot.end)));
    v.append($("<br/>"));
    appendLocation(v, slot.location);
    return v;
  }

  function viewOfCalendarOptions(listRoot, calChoices, hideEndTimes) {
    for (var i in calChoices) {
      listRoot.append(viewOfCalendarSlot(calChoices[i].slot, hideEndTimes));
    }
    return listRoot;
  }

  function viewOfSchedulingQuestion(q) {
    var v = viewOfChatText(q.body);
    v.append(viewOfCalendarOptions(
      $("<ol/>", {type:"A"}),
      q.choices,
      q.hide_end_times
    ));
    return v;
  }

  function audioPlayer(audioLink) {
    return $("<audio/>", {src:audioLink, controls:true})
           .text("Left a voice message.")
           .bind('ended', function() {
             this.load();
           });
  }

  function viewOfChatData(chat_item) {
    var kind = chat_item.chat_item_data[0];
    var data = chat_item.chat_item_data[1];
    switch (kind) {
    case "Message":
      return viewOfChatText(data);
    case "Complex_message":
      return viewOfComplexMessage(data.body, data.fresh_content);
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
    var view = $("<div/>");
    if (util.isNotNull(item.id)) {
      view.attr("id", "chat-" + item.id);
    }

    var sender = $("<div class='message-sender'/>")
      .append(initials(item.by))
      .appendTo(view);

    var message = $("<div class='message'/>")
      .appendTo(view);
    var header = $("<div class='message-header' />")
      .appendTo(message);

    var line1 = $("<div class='header-line-1 clearfix'/>")
      .appendTo(header);
    var fromName = $("<div class='col-xs-6 from-name' />")
      .append(full_name(item.by))
      .appendTo(line1);
    var timestamp = $("<div class='col-xs-6 timestamp' />")
      .append($("<div class='timestamp' />")
              .append(date.viewTimeAgo(date.ofString(time))))
      .appendTo(line1);

    var line2 = $("<div class='header-line-2 hide'/>")
      .appendTo(header);
    var toName = $("<div class='to-names' />")
      .append("to " + "me")
      .appendTo(line2);

    message.append($("<div class='message-text'/>").append(viewOfChatData(item)));
    // message.append($("<div class='message-status' />").append(status));
    view.append($("<hr/>"));

    return view;
  }

  function statusOfChatItem(item) {
    return item.time_read ? "Read" : "Posted";
  }

  // function editChoiceOption() {
  //   var v = $("<li class='option'/>");
  //   var radio = $("<div class='option-radio'/>")
  //     .appendTo(v);

  //   var editDiv = $("<div class='options-input'/>");
  //   var edit = $("<input class='form-control'/>")
  //     .appendTo(editDiv);
  //   v.append(editDiv);

  //   edit.keyup(function (e) {
  //     switch (e.which) {
  //     case 13:
  //       if (edit.val() !== "") {
  //         var li = editChoiceOption();
  //         removeChoiceOption(li);
  //         v.after(li);
  //         li.find("input").focus();
  //       }
  //       return false;

  //     case 8:
  //     case 46:
  //       if (edit.val() === "" && 2 < v.parent().children().length) {
  //         v.prev().find("input").focus();
  //         v.remove();
  //         return false;
  //       } else {
  //         return true;
  //       }

  //     default:
  //       return true;
  //     }
  //   });

  //   return v;
  // }

  // function removeChoiceOption(li) {
  //   var deleteDiv = $("<div/>");
  //   var x = $("<img class='option-delete'/>")
  //       .appendTo(deleteDiv);
  //   svg.loadImg(x, "/assets/img/delete.svg");

  //   deleteDiv.click(function() {
  //     li.prev().find("input").focus();
  //     li.remove();
  //   });

  //   deleteDiv.appendTo(li);
  // }

  // function buttonToAddChoiceOption() {
  //   var v = $("<li class='option'/>");
  //   var emptyRadio = $("<div class='option-radio add-option-radio'/>");
  //   emptyRadio.appendTo(v);

  //   var button = $("<button class='add-option-btn'>Click to add option</button>");
  //   button.click(function() {
  //     var li = editChoiceOption();
  //     removeChoiceOption(li);
  //     v.before(li);
  //     li.find("input").focus();
  //   });

  //   v.append(button);

  //   return v;
  // }

  // function editChoices() {
  //   var v = $("<ul class='option-list'/>");
  //   var opt1 = editChoiceOption()
  //     .appendTo(v);
  //   v.append(buttonToAddChoiceOption());
  //   return v;
  // }

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

  function chatEditor(blank, messages, task, textBox, writeButton) {
    var chatFooter = $("<div class='chat-footer scrollable'/>");
    var editor = $("<div class='chat-editor'/>")
      .append(textBox)
      .appendTo(chatFooter);

    textBox.autosize();

    if (task.task_chat_items.length === 0) {
      textBox.attr("placeholder", "Write a message...");
    } else {
      textBox.attr("placeholder", "Write a reply...");
    }

    textBox.val("");

    // var choicesEditor = editChoices();
    // choicesEditor.hide();
    // chatFooter.append(choicesEditor);

    var chatActions = $("<div class='chat-actions clearfix'/>")
      .appendTo(editor);
    var selChoicesDiv = $("<div class='col-xs-10 offer-choices'/>")
      .appendTo(chatActions);
    var sendDiv = $("<div class='col-xs-2 chat-send'/>")
      .appendTo(chatActions);

    // var selChoices = $("<img class='offer-choices-checkbox'/>");
    // selChoicesDiv.append(selChoices);
    // svg.loadImg(selChoices, "/assets/img/checkbox-sm.svg");
    // var selChoicesLabel = $("<div/>", {
    //   'class': "offer-choices-label unselectable",
    //   'text': "Offer multiple choice response."
    // });
    // selChoicesDiv.append(selChoicesLabel);

    // selChoicesDiv.click(function () {
    //   if (selChoicesDiv.hasClass("checkbox-selected")) {
    //     selChoicesDiv.removeClass("checkbox-selected");
    //     util.cancelFocus();
    //   } else {
    //     selChoicesDiv.addClass("checkbox-selected");
    //     var first = choicesEditor.children().eq(0).find("input");
    //     util.changeFocus(first);
    //   }
    //   choicesEditor.toggle();
    //   util.focus();
    // });

    var sendButton = $("<button/>")
      .addClass('btn btn-primary chat-send-btn disabled')
      .text("Send")
      .appendTo(sendDiv);

    textBox.on("keyup", function (e){
      if ($(this).val() !== "") {
        sendButton.removeClass("disabled");
      } else {
        sendButton.addClass("disabled");
      }
    });

    sendButton.click(function () {
      var data = selChoicesDiv.hasClass("checkbox-selected")
               ? selector_q_data(textBox.val(), choicesEditor)
               : message_data(textBox.val());
      if (data) {
        var me = login.me();
        var item = {
          tid: task.tid,
          by: me,
          to: task.task_participants.organized_by,
          chat_item_data:data
        };
        textBox.val("");
        textBox.attr("placeholder", "Write a reply...");

        // if (selChoicesDiv.hasClass("checkbox-selected")) {
        //   choicesEditor.toggle();
        //   selChoicesDiv.removeClass("checkbox-selected");
        //   var numOptions = choicesEditor.children().length-1;
        //   if (numOptions > 1) {
        //     for (var i=numOptions-1; i>0; i--) {
        //       choicesEditor.children().eq(i).remove();
        //     }
        //   }
        // }

        if (task.task_chat_items.length === 0) {
          blank.addClass("hide");
        }

        mod.postChatItem(item);

        if (writeButton != null) {
          chatFooter.addClass("hide");
          writeButton.removeClass("hide");
        }
      }
    });

    return chatFooter;
  }

  var observeChatPosted = 0;

  function chatPosting(item) {
    var tempItemView = viewOfChatItem(item, Date.now(), "Posting");
    var itemView = util.isNotNull(item.id) ? $("#chat-" + item.id) : [];
    if (itemView.length > 0) {
      itemView.replaceWith(tempItemView);
    } else {
      $(".chat-panel .messages").prepend(tempItemView);
    }

    var key = ++observeChatPosted;
    observable.onChatPosted.observe(key, function(item) {
      tempItemView.replaceWith(viewOfChatItem(item, item.time_created,
                                              statusOfChatItem(item)));
      observable.onChatPosted.stopObserve(key);
    });
  }

  function chatView(task) {
    var me = login.me();
    var v = $("<div/>");
    var textBox = $("<textarea class='chat-entry'></textarea>");
    var blank = $("<div class='blank-chat hide'></div>");

    if (! $("#chat").hasClass("modal-body")) {
      var writeArea;

      var writeButton = $("<textarea class='write-message'></textarea>")
        .appendTo(v)
        .click(function() {
          writeButton.addClass("hide");
          writeArea.removeClass("hide");
          textBox.focus();
        });

      if (task.task_chat_items.length === 0) {
        writeButton.attr("placeholder", "Write a message...");
      } else {
        writeButton.attr("placeholder", "Write a reply...");
      }

      writeArea = chatEditor(blank, messages, task, textBox, writeButton)
        .addClass("hide")
        .appendTo(v);
    }

    var messages = $("<div class='messages scrollable'></div>")
      .append(blank)
      .appendTo(v);

    var blankChatIcon = $("<img class='blank-chat-icon'/>")
      .appendTo(blank);
    svg.loadImg(blankChatIcon, "/assets/img/blank-chat.svg");
    if ($("#chat").hasClass("modal-body")) {
      blank.append($("<div>Start the conversation below.</div>"));
    } else {
      blank.append($("<div class='no-messages'>No messages found.</div>"))
           .append($("<hr/>"));
    }

    if (task.task_chat_items.length === 0) {
      blank.removeClass("hide");
    } else {
      list.iter(task.task_chat_items, function(item) {
        var status;
        if (! item.time_read && item.id && me !== item.by) {
          api.postChatItemRead(item.id);
          status = "Read";
        } else {
          status = statusOfChatItem(item);
        }
        messages.prepend(viewOfChatItem(item, item.time_created, status));
      });
    }

    if ($("#chat").hasClass("modal-body")) {
      v.append(chatEditor(blank, messages, task, textBox, null));
    }

    return v;
  }

  function updateUnreadCount(x) {
    var newMessages = x;

    if (newMessages > 0) {
      var newCount = document.getElementById("unread-count");
      newCount.firstChild.nodeValue = newMessages;
      $("#chat-icon-container").addClass("unread-messages");
    }
  }

  mod.clearTaskChats = function() {
    $(".chat-profile-tabs li").remove();
    $(".chat-panel div").remove();
  }

  mod.loadTaskChats = function(ta) {
    mod.clearTaskChats();

    var chatModal = $("#chat-modal");

    $("#chat-icon-container")
      .unbind("click")
      .click(function() {
        chatModal.modal({});
      })

    updateUnreadCount(0);

    var tabs = $(".chat-profile-tabs");

    profile.profilesOfTaskParticipants(ta)
    .done(function(profs) {
      profiles = profs;
      $(".chat-panel").append(chatView(ta));

      var tab = $("<a>All</a>", {"class":"tab-name", "data-toggle":"tab"});
      tabs.append($("<li class='chat-tab-div'/>").append(tab));

      observable.onChatPosting.observe("chat-tabs", chatPosting);
      observable.onTaskParticipantsChanged
                              .observe("chat-tabs", mod.loadTaskChats);
    });
  }

  mod.loadGuestTaskChats = function(ta) {
    mod.clearTaskChats();
    updateUnreadCount(0);

    profile.profilesOfTaskParticipants(ta)
    .done(function(profs) {
      profiles = profs;
      $(".chat-panel").append(chatView(ta));

      observable.onChatPosting.observe("chat-tabs", chatPosting);
      observable.onTaskParticipantsChanged
                              .observe("chat-tabs", mod.loadGuestTaskChats);
    });
  }

  return mod;
}());
