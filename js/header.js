/*
  Home page (task lists)
*/

var header = (function() {
  var mod = {};

  var loggedIn = $(".header-logged-in");

  // Saved in load(), to populate later when tasks are available
  var toDoPopoverView = null;
  var toDoCountView = null;
  var notificationsPopoverView = null;
  var notificationsCountView = null;

  function hideAllPopovers() {
    $(".header-popover").each(function() {
      $(this)
        .removeClass("open")
        .attr("style","display:none");
    })
    $(".header-account-arrow").removeClass("open");
  }

  function togglePopover(popover) {
    if (popover.hasClass("open")) {
      popover
        .removeClass("open")
        .attr("style","display:none");
      if (popover.hasClass("header-account-popover")) {
        $(".header-account-arrow").removeClass("open");
      }
    } else {
      hideAllPopovers();
      popover
        .addClass("open")
        .attr("style","display:block");
      if (popover.hasClass("header-account-popover")) {
        $(".header-account-arrow").addClass("open");
      }
    }
  }

  function viewOfAssisting() {
'''
<div #view>
  <div #name class="assisting-name"/>
  <div #circ class="assisting-circ"/>
</div>
'''
    profile.get(login.leader()).done(function(obsProf) {
      var p = obsProf.prof;
      var fullName = profile.fullName(p);
      circ.text(profile.shortenName(fullName).substring(0,1).toUpperCase());
      name.text(fullName);
    });

    return view;
  }

  function guestNames(profs, ta) {
    var guests = sched.getAttendingGuests(ta);
    var names = [];
    list.iter(guests, function(guest) {
      names.push(profile.fullNameOrEmail(profs[guest].prof));
    });
    return names.join(" + ");
  }

  function viewOfToDo(profs, ta) {
'''
<li #view class="to-do">
  <div #toDoText class="to-do-text"/>
  <div #timestamp class="header-popover-timestamp"/>
</li>
'''
    toDoText
      .append($("<span class='bold'/>")
        .text(sched.eaStatus(ta)))
      .append($("<span/>")
        .text(" - " + sched.getMeetingType(ta) + " with " + guestNames(profs, ta)));

    // Implement jQuery dotdotdot()
    // toDoText.dotdotdot();

    var statusDetails = sched.taskStatus(ta);
    timestamp
      .append($("<span/>").text("Updated "))
      .append(statusDetails.timeAgo)
      .append(" at " + statusDetails.time);

    // So we can find it to update later, when the task changes
    view.attr("id", "toDo-" + ta.tid);

    view.click(function() {
      window.location.hash = "#!task/" + ta.tid;
    });

    return view;
  }

  // Called afer header.load(), once we have the tasks in home.showAllTasks()
  // TODO: Refactor this shit so we create the header with the tasks?
  mod.populateToDoList = function(tasks) {
    var toDoList = toDoPopoverView.find(".to-do-list");
    toDoList.children().remove();
    var deferredToDos = list.filter_map(tasks, function(ta) {
      if (sched.isToDoStep(ta) && ta.task_status.task_progress !== "Closed") {
        return profile.profilesOfTaskParticipants(ta).then(function(profs) {
          return viewOfToDo(profs, ta);
        });
      } else return null;
    });
    deferred.join(deferredToDos).done(function(toDos) {
      if (toDos.length > 0) {
        toDoCountView.text(toDos.length);
        toDoCountView.show();
      } else
        toDoCountView.hide();
      list.iter(toDos, function(toDo) {
        toDoList.append(toDo);
      });
    });
  };

  function addToDoCount(incr) {
    var cur = parseInt(toDoCountView.text());
    cur = cur + incr;
    toDoCountView.text(cur);
    if (cur > 0)
      toDoCountView.show();
    else
      toDoCountView.hide();
  }

  // When a task changes, update the ToDo list accordingly
  mod.updateToDo = function(ta) {
    var toDoList = toDoPopoverView.find(".to-do-list");
    var toDo = toDoList.find("#toDo-" + ta.tid);
    if (sched.isToDoStep(ta)) {
      profile.profilesOfTaskParticipants(ta).done(function(profs) {
        var newView = viewOfToDo(profs, ta);
        if (toDo.length > 0) toDo.replaceWith(newView);
        else {
          toDoList.append(newView);
          addToDoCount(1);
        }
      });
    } else {
      if (toDo.length > 0) {
        toDo.remove();
        addToDoCount(-1);
      }
    }
  }

  function viewOfToDoPopover() {
'''
<div #view>
  <div #caretContainer class="popover-caret to-do-caret"/>
  <div class="header-to-do-popover">
    <div class="popover-content">
      <div class="header-popover-header">
        <div class="header-popover-title">To Do</div>
      </div>
      <ul #toDoList class="to-do-list"/>
      <div class="see-all">
        <a class="link">See all</a>
      </div>
    </div>
  </div>
</div>
'''
    var caret = $("<img class='svg-block'/>")
      .appendTo(caretContainer);
    svg.loadImg(caret, "/assets/img/popover-caret.svg");

    return view;
  }

  function viewOfNotification(ta) {
'''
<li #view class="notification">
  <div #notificationText class="notification-text"/>
  <div #timestamp class="header-popover-timestamp"/>
</li>
'''
    var unread = ta.task_status_text.status_unread_messages;
    var pluralS = unread > 1 ? "s" : "";
    notificationText
      .append($("<span class='bold'/>")
        .text(ta.task_status.task_title))
      .append($("<span/>")
        .text(" has " + unread + " unread message" + pluralS + "."));

    // Implement jQuery dotdotdot()
    // notificationText.dotdotdot();

    var statusDetails = sched.taskStatus(ta);
    timestamp
      .append("Updated ")
      .append(statusDetails.timeAgo)
      .append(" at ")
      .append(statusDetails.time);

    // So we can find it to update later, when the task changes
    view.attr("id", "notif-" + ta.tid);
    view.data("unread", unread);

    view.click(function() {
      window.location.hash = "#!task/" + ta.tid;
    });

    return view;
  }

  function viewOfNotificationsPopover() {
'''
<div #view>
  <div #caretContainer class="popover-caret notifications-caret"/>
  <div class="header-notifications-popover">
    <div class="popover-content">
      <div class="header-popover-header">
        <div class="header-popover-title">Notifications</div>
        <a class="mark-read link">Mark read</a>
      </div>
      <ul #notificationsList class="notifications-list scrollable"/>
      <div class="see-all">
        <a class="link">See all</a>
      </div>
    </div>
  </div>
</div>
'''
    var caret = $("<img class='svg-block'/>")
      .appendTo(caretContainer);
    svg.loadImg(caret, "/assets/img/popover-caret.svg");

    return view;
  }

  mod.populateNotifications = function(tasks) {
    var notifList = notificationsPopoverView.find(".notifications-list");
    notifList.children().remove();
    var unreadCount = 0;
    list.iter(tasks, function(ta) {
      var unread = ta.task_status_text.status_unread_messages;
      if (unread > 0) {
        unreadCount += unread;
        notifList.append(viewOfNotification(ta));
      }
    });
    if (unreadCount > 0) {
      notificationsCountView.text(unreadCount);
      notificationsCountView.show();
    } else
      notificationsCountView.hide();
  }

  function addNotifsCount(incr) {
    var cur = parseInt(notificationsCountView.text());
    cur = cur + incr;
    notificationsCountView.text(cur);
    if (cur > 0)
      notificationsCountView.show();
    else
      notificationsCountView.hide();
  }

  mod.updateNotifications = function(ta) {
    var notifList = notificationsPopoverView.find(".notifications-list");
    var notif = notifList.find("#notif-" + ta.tid);
    var unread = ta.task_status_text.status_unread_messages;
    if (unread > 0) {
      var newView = viewOfNotification(ta);
      if (notif.length > 0) {
        var oldUnread = notif.data("unread");
        addNotifsCount(unread - oldUnread);
        notif.replaceWith(newView);
      } else {
        notifList.append(newView);
        addNotifsCount(unread);
      }
    } else {
      if (notif.length > 0) {
        var oldUnread = notif.data("unread");
        addNotifsCount(-1 * oldUnread);
        notif.remove();
      }
    }
  }

  function switchTeam(team) {
    login.setTeam(team);
    home.load();
  }

  function labelOfTeam(team) {
    var label = team.team_label;
    if (! util.isString(label) || label === "")
      label = team.teamname;
    return label;
  }

  function clickableViewOfTeam(team, prof) {
    var isActive = login.getTeam().teamname === team.teamname;
    var label = profile.fullNameOrEmail(prof);
    var li = $("<li/>");
    var a = $("<a href='#'/>")
      .appendTo(li);
    var pic = $("<div class='team-list-circ'/>")
      .text(profile.shortenName(label).substring(0,1))
      .appendTo(a);
    var div = $("<div class='team-list-name ellipsis'/>")
      .text(label)
      .appendTo(a);

    if (isActive) {
      li.addClass("active");
      a.addClass("active");
      pic.addClass("active");
    } else {
      li.click(function() {
        switchTeam(team);
      });
    }

    return li;
  }

  function sortTeams(a) {
    return list.sort(a, function(t1, t2) {
      var l1 = labelOfTeam(t1);
      var l2 = labelOfTeam(t2);
      return l1.localeCompare(l2);
    });
  }

  function insertTeams(view) {
    view.children().remove();
    var teams = sortTeams(login.getTeams());
    list.iter(list.rev(teams), function(team) {
      profile.get(team.team_leaders[0]).done(function(obsProf) {
        clickableViewOfTeam(team, obsProf.prof)
          .appendTo(view);
      });
    });
  }

  function viewOfAccountPopover() {
'''
<div #view class="popover-content">
  <div class="popover-account-info">
    <div #accountName class="popover-account-name ellipsis"/>
    <div #accountEmail class="popover-account-email ellipsis"/>
  </div>
  <div class="popover-assist-text">Use Esper to assist:</div>
  <ul #teamList class="popover-team-list popover-list">
  </ul>
  <ul class="popover-list">
    <li>
      <a href="#!settings" data-toggle="tab">Settings</a>
    </li>
    <li>
      <a href="#!logout">Sign out</a>
    </li>
  </ul>
</div>
'''
    api.getProfile(login.me()).done(function(eaProf) {
      accountName.text(profile.fullName(eaProf));
      accountEmail.text(profile.email(eaProf));
    });

    insertTeams(teamList);

    return view;
  }

  mod.clear = function() {
    $(".header-popover").each(function() {
      $(this).children().remove();
    })
    hideAllPopovers();
    loggedIn.children().remove();
    loggedIn.addClass("hide");
  }

  mod.load = function() {
'''
<div #view>
  <div class="header-account">
    <div #accountArrow class="header-popover-click header-account-arrow"/>
    <div #accountPopover class="header-popover header-account-popover"
         style="display:none"/>
  </div>
  <div #assisting class="header-assisting"/>
  <div #notifications class="header-notifications">
    <div #notificationsIcon class="header-popover-click header-notifications-icon unread"/>
    <div #notificationsCount class="header-notifications-count"/>
    <div #notificationsPopover class="header-popover"
         style="display:none"/>
  </div>
  <div #toDo class="header-to-do">
    <div #toDoIcon class="header-popover-click header-to-do-icon incomplete"/>
    <div #toDoCount class="header-to-do-count"/>
    <div #toDoPopover class="header-popover"
         style="display:none"/>
  </div>
</div>
'''
    var arrow = $("<img class='svg-block'/>")
      .appendTo(accountArrow);
    svg.loadImg(arrow, "/assets/img/arrow-south-sm.svg");

    var bell = $("<img class='svg-block'/>")
      .appendTo(notificationsIcon);
    svg.loadImg(bell, "/assets/img/notifications.svg");

    var clipboard = $("<img class='svg-block'/>")
      .appendTo(toDoIcon);
    svg.loadImg(clipboard, "/assets/img/to-do.svg");

    accountPopover.append(viewOfAccountPopover());
    assisting.append(viewOfAssisting());

    // Save to populate ToDos later
    if (toDoPopoverView === null)
      toDoPopoverView = viewOfToDoPopover();
    toDoPopover.append(toDoPopoverView);
    if (toDoCountView === null)
      toDoCountView = toDoCount;
    else
      toDoCount.replaceWith(toDoCountView);

    // Save to populate notifications later
    if (notificationsPopoverView === null)
      notificationsPopoverView = viewOfNotificationsPopover();
    notificationsPopover.append(notificationsPopoverView);
    if (notificationsCountView === null)
      notificationsCountView = notificationsCount;
    else
      notificationsCount.replaceWith(notificationsCountView);

    accountArrow
      .off("click")
      .click(function() {
        togglePopover(accountPopover);
      });

    notificationsIcon
      .off("click")
      .click(function() {
        togglePopover(notificationsPopover);
      });

    toDoIcon
      .off("click")
      .click(function() {
        togglePopover(toDoPopover);
      });

    $("body").on("click", function (e) {
      var target = e.target;
      $(".header-popover").each(function () {
        if ($(this).hasClass("open")
            && !$(this).is(target)
            && !$(target).hasClass("header-popover-click")
            && $(target).parents(".header-popover").length === 0
            && $(target).parents(".header-popover-click").length === 0) {
              hideAllPopovers();
        }
      });
    });

    hideAllPopovers();
    loggedIn.children().remove();
    loggedIn
      .append(view)
      .removeClass("hide");
  };

  return mod;
}());
