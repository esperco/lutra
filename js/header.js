/*
  Home page (task lists)
*/

var header = (function() {
  var mod = {};

  var loggedIn = $(".header-logged-in");

  /* Saved in load(),
   * so we can update the existing list/count when a task changes */
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

  function addToDoCount(incr) {
    var cur = parseInt(toDoCountView.text());
    cur = cur + incr;
    toDoCountView.text(cur);
    if (cur > 0)
      toDoCountView.show();
    else
      toDoCountView.hide();
  }

  // When a task changes, update the existing ToDo list accordingly
  mod.updateToDo = function(ta) {
    var toDoList = toDoPopoverView.find(".to-do-list");
    var toDo = toDoList.find("#toDo-" + ta.tid);
    if (sched.isToDoStep(ta)) {
      profile.fetchProfilesOfTaskParticipants(ta).done(function(profs) {
        var newView = viewOfToDo(profs, ta);
        if (util.elementFound(toDo))
          toDo.replaceWith(newView);
        else {
          toDoList.append(newView);
          addToDoCount(1);
        }
      });
    } else {
      if (util.elementFound(toDo)) {
        toDo.remove();
        addToDoCount(-1);
      }
    }
  }

  function viewOfToDoPopover(tasks) {
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

    if (util.isNotNull(tasks)) {
      var deferredToDos = list.filter_map(tasks, function(ta) {
        if (sched.isToDoStep(ta) && ta.task_status.task_progress !== "Closed") {
          return profile.fetchProfilesOfTaskParticipants(ta)
            .then(function(profs) {
              return viewOfToDo(profs, ta);
            });
        } else return null;
      });
      deferred.join(deferredToDos).done(function(toDos) {
        toDoCountView.text(toDos.length);
        if (toDos.length > 0)
          toDoCountView.show();
        else
          toDoCountView.hide();
        list.iter(toDos, function(toDo) {
          toDoList.append(toDo);
        });
      });
    }

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
    // Needed to calculate the change to the total count (old vs. new)
    view.data("unread", unread);

    view.click(function() {
      window.location.hash = "#!task/" + ta.tid;
    });

    return view;
  }

  function viewOfNotificationsPopover(tasks) {
'''
<div #view>
  <div #caretContainer class="popover-caret notifications-caret"/>
  <div class="header-notifications-popover">
    <div class="popover-content">
      <div class="header-popover-header">
        <div class="header-popover-title">Notifications</div>
        <a class="mark-read link">Mark read</a>
      </div>
      <ul #notifList class="notifications-list scrollable"/>
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

    if (util.isNotNull(tasks)) {
      notifList.children().remove();
      var unreadCount = 0;
      list.iter(tasks, function(ta) {
        var unread = ta.task_status_text.status_unread_messages;
        if (unread > 0) {
          unreadCount += unread;
          notifList.append(viewOfNotification(ta));
        }
      });
      notificationsCountView.text(unreadCount);
      if (unreadCount > 0)
        notificationsCountView.show();
      else
        notificationsCountView.hide();
    }

    return view;
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

  // When a task changes, update the existing notifications list accordingly
  mod.updateNotifications = function(ta) {
    var notifList = notificationsPopoverView.find(".notifications-list");
    var notif = notifList.find("#notif-" + ta.tid);
    var unread = ta.task_status_text.status_unread_messages;
    if (unread > 0) {
      var newView = viewOfNotification(ta);
      if (util.elementFound(notif)) {
        var oldUnread = notif.data("unread");
        addNotifsCount(unread - oldUnread);
        notif.replaceWith(newView);
      } else {
        notifList.append(newView);
        addNotifsCount(unread);
      }
    } else {
      if (util.elementFound(notif)) {
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
      <a #settings data-toggle="tab">Settings</a>
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

    settings.click(function() {
      location.hash = "#!settings";
      hideAllPopovers();
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

  /* You need to pass in the list of active tasks
   * if you want the ToDos and notifications to be refreshed */
  mod.load = function(optTasks) {
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

    /* Create new ToDo list from optTasks only if it doesn't already exist;
     * otherwise, use the current one, saved in toDoPopoverView
     * and its count from toDoCountView */
    if (toDoCountView === null)
      toDoCountView = toDoCount;
    else
      toDoCount.replaceWith(toDoCountView);
    if (toDoPopoverView === null) {
      toDoPopoverView = viewOfToDoPopover(optTasks);
    }
    toDoPopover.append(toDoPopoverView);

    /* Create new notif list from optTasks only if it doesn't already exist;
     * otherwise, use the current one, saved in notificationsPopoverView
     * and its count from notificationsCountView */
    if (notificationsCountView === null)
      notificationsCountView = notificationsCount;
    else
      notificationsCount.replaceWith(notificationsCountView);
    if (notificationsPopoverView === null) {
      notificationsPopoverView = viewOfNotificationsPopover(optTasks);
    }
    notificationsPopover.append(notificationsPopoverView);

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
