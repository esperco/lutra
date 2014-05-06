/*
  Home page (task lists)
*/

var header = (function() {
  var mod = {};

  var loggedIn = $(".header-logged-in");

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

  function viewOfToDo() {
'''
<li #view class="to-do">
  <div #toDoText class="to-do-text"/>
  <div #timestamp class="header-popover-timestamp"/>
</li>
'''
    toDoText
      .append($("<span class='bold'/>")
        .text("Offer meeting options"))
      .append($("<span/>")
        .text(" - Coffee with Johnny Appleseed"));

    // Implement jQuery dotdotdot()
    // toDoText.dotdotdot();

    timestamp.text("Yesterday at 12:45pm");

    return view;
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

    //iterate through to do's
    toDoList.append(viewOfToDo);

    return view;
  }

  function viewOfNotification() {
'''
<li #view class="notification">
  <div #notificationText class="notification-text"/>
  <div #timestamp class="header-popover-timestamp"/>
</li>
'''
    notificationText
      .append($("<span class='bold'/>")
        .text("Johnny Appleseed"))
      .append($("<span/>")
        .text(" sent you a message."));

    // Implement jQuery dotdotdot()
    // notificationText.dotdotdot();

    timestamp.text("Apr 30 at 12:45pm");

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

    //iterate through notifications
    notificationsList.append(viewOfNotification);

    return view;
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
    <div #notificationsCount class="header-notifications-count">5</div>
    <div #notificationsPopover class="header-popover"
         style="display:none"/>
  </div>
  <div #toDo class="header-to-do">
    <div #toDoIcon class="header-popover-click header-to-do-icon incomplete"/>
    <div #toDoCount class="header-to-do-count">2</div>
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
    notificationsPopover.append(viewOfNotificationsPopover());
    toDoPopover.append(viewOfToDoPopover());

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
