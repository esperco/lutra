var chat = (function () {
  var mod = {};
  var profiles = {};

  mod.postChatItem = function(item) {
    observable.onChatPosting.notify(item);
    return api.postChatItem(item).done(observable.onChatPosted.notify);
  }

  function full_name(uid) {
    var p = profiles[uid].prof;
    return p ? profile.fullNameOrEmail(p) : "John Doe";
  }

  function firstInitial(uid) {
    var p = profiles[uid].prof;
    return profile.veryShortNameOfProfile(p).substring(0,1);
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

  function viewOfCalendarSlot(slot) {
    var v = $("<li/>");
    if (util.isNotNull(slot.end)) {
      v.text(date.range(date.ofString(slot.start), date.ofString(slot.end)));
    } else {
      v.text(date.justStartTime(date.ofString(slot.start)));
    }
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
    v.append(viewOfCalendarOptions(
      $("<ol/>", {type:"A"}),
      q.choices
    ));
    return v;
  }

  function audioPlayer(x) {
    var player = $("<audio controls/>")
      .text("Left a voice message.")
      .bind('ended', function() {
        this.load();
      });
    var src = x.sources;
    var ogg = src.ogg_vorbis;
    var mp3 = src.mp3;
    var src_ogg = $("<source/>", { src: ogg.src, type: ogg.type });
    var src_mp3 = $("<source/>", { src: mp3.src, type: mp3.type });
    player
      .append(src_ogg)
      .append(src_mp3);
    return player;
  }

  function viewOfChatData(chat_item) {
    var kind = chat_item.chat_item_data[0];
    var data = chat_item.chat_item_data[1];
    switch (kind) {
    case "Message":
      return viewOfChatText(data);
    case "Complex_message":
      return viewOfComplexMessage(data.body, data.fresh_content);
    case "Audio_msg":
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

  function showAllItem(item, itemView) {
    itemView.removeClass("hide");
  }
  var showItem = showAllItem;

  function viewOfChatItem(item, time, status) {
    var view = $("<div/>", {"class":"chatitem"});
    if (util.isNotNull(item.id)) {
      chatItems[item.id] = item;
      view.attr("id", "chat-" + item.id);
    }

    var sender = $("<div class='message-sender'/>")
      .text(firstInitial(item.by))
      .appendTo(view);

    if (item.by == login.me()) {
      sender.addClass("me");
    }

    var message = $("<div class='message'/>")
      .appendTo(view);
    var header = $("<div class='message-header' />")
      .appendTo(message);

    var timestamp = $("<div class='timestamp' style='float:right'/>")
      .append($("<div class='timestamp' />")
        .append(date.viewTimeAgo(date.ofString(time))))
      .appendTo(header);

    var fromName = $("<div class='from-name'/>")
      .append(full_name(item.by))
      .appendTo(header);

    var recipients = list.map(item.to, function(uid) {
      return profile.fullNameOrEmail(profiles[uid].prof);
    }).join(", ");
    var toName = $("<div class='to-names' />")
      .text("to " + recipients)
      .appendTo(header);

    message.append($("<div class='message-text'/>").append(viewOfChatData(item)));
    // message.append($("<div class='message-status' />").append(status));
    view.append($("<hr/>"));

    showItem(item, view);
    return view;
  }

  function statusOfChatItem(item) {
    return item.time_read ? "Read" : "Posted";
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

  var chatRecipients;

  function chatEditor(blank, messages, task, textBox, writeButton) {
    var editor = $("<div class='chat-editor'/>")
      .append(textBox);

    textBox.attr("placeholder", "Write a message...")
           .val("")
           .autosize();

    var chatActions = $("<div class='chat-actions clearfix'/>")
      .appendTo(editor);
    var selChoicesDiv = $("<div class='col-xs-10 offer-choices'/>")
      .appendTo(chatActions);
    var sendDiv = $("<div class='col-xs-2 chat-send'/>")
      .appendTo(chatActions);

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
          to: chatRecipients,
          chat_item_data:data
        };
        textBox.val("");

        if (task.task_chat_items.length === 0) {
          blank.addClass("hide");
        }

        mod.postChatItem(item);

        if (writeButton != null) {
          editor.addClass("hide");
          writeButton.removeClass("hide");
        }

        mp.track("Send chat message");

        sendButton.addClass("disabled")
                  .blur();
      }
    });

    return editor;
  }

  var chatTid;
  var chatItems;
  var observeChatPosted = 0;

  function chatPosting(item) {
    if (item.tid === chatTid) {
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
  }

  function chatView(task) {
    var me = login.me();
    var v = $("<div/>");
    var textBox = $("<textarea class='chat-entry'></textarea>");
    var blank = $("<div class='blank-chat hide'></div>");

    $("#compose-from").text(firstInitial(me));

    var writeArea;

    if ($("#chat").hasClass("guest-app")) {
      var writeButton = $("<textarea class='write-message'></textarea>")
        .attr("placeholder", "Write a message...")
        .appendTo(v)
        .click(function() {
          writeButton.addClass("hide");
          writeArea.removeClass("hide");
          textBox.focus();
        });

      writeArea = chatEditor(blank, messages, task, textBox, writeButton)
        .addClass("hide")
        .appendTo(v);
    } else {
      writeArea = chatEditor(blank, messages, task, textBox, null)
        .appendTo(v);
    }

    var messages = $("<div class='messages scrollable'></div>")
      .append(blank)
      .appendTo(v);

    var blankChatIcon = $("<img class='blank-chat-icon'/>")
      .appendTo(blank);
    svg.loadImg(blankChatIcon, "/assets/img/blank-chat.svg");
    blank.append($("<div class='no-messages'>No message history</div>"))
         .append($("<hr/>"));

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

    return v;
  }

  function updateUnreadCount(x) {
    var newMessages = x;

    if (newMessages > 0) {
      var newCount = document.getElementById("unread-count");
      newCount.firstChild.nodeValue = newMessages;
      $("#messages-tab").addClass("unread-messages");
    }
  }

  mod.clearTaskChats = function() {
    $(".chat-profile-tabs li").remove();
    $(".chat-panel div").remove();
  }

  function makeChatTabs(ta, uids) {
    var tabs = $(".chat-profile-tabs");

    var allTab = $("<a/>", {"class":"tab-name", "data-toggle":"tab"});
    allTab.text("All");
    allTab.click(function() {
      chatRecipients = ta.task_participants.organized_for;
      showItem = showAllItem;
      $(".chatitem").removeClass("hide");
    });
    tabs.append($("<li class='active chat-tab-div'/>").append(allTab));

    list.iter(uids, function(uid) {
      var tab = $("<a/>", {"class":"tab-name", "data-toggle":"tab"});
      tab.text(profile.fullNameOrEmail(profiles[uid].prof));
      tab.click(function() {
        chatRecipients = [uid];
        showItem = function(item, itemView) {
          if (item.by === uid || list.mem(item.to, uid)) {
            itemView.removeClass("hide");
          } else {
            itemView.addClass("hide");
          }
        };
        for (var itemId in chatItems) {
          showItem(chatItems[itemId], $("#chat-" + itemId));
        }
      });
      tabs.append($("<li class='chat-tab-div'/>").append(tab));
    });
  }

  mod.loadTaskChats = function(ta) {
    chatTid = ta.tid;
    chatItems = {};
    chatRecipients = ta.task_participants.organized_for;
    $(".chat-subject").text(ta.task_status.task_title);

    mod.clearTaskChats();
    updateUnreadCount(0);

    profile.profilesOfTaskParticipants(ta)
    .done(function(profs) {
      profiles = profs;

      $(".chat-panel").append(chatView(ta));
      makeChatTabs(ta, ta.task_participants.organized_for);

      observable.onChatPosting.observe("chat-tabs", chatPosting);
      observable.onTaskParticipantsChanged
                              .observe("chat-tabs", mod.loadTaskChats);
    });
  }

  mod.loadGuestTaskChats = function(task) {
    var ta = task.guest_task;
    chatTid = ta.tid;
    chatItems = {};
    chatRecipients = ta.task_participants.organized_by;

    mod.clearTaskChats();
    updateUnreadCount(0);

    profile.profilesOfTaskParticipants(ta)
    .done(function(profs) {
      profiles = profs;
      $(".chat-panel").append(chatView(ta));

      if (task.guest_chat_with.length > 1) {
        makeChatTabs(ta, task.guest_chat_with);
      }

      observable.onChatPosting.observe("chat-tabs", chatPosting);
    });
  }

  return mod;
}());
