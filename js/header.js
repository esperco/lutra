/*
  Home page (task lists)
*/

var header = (function() {
  var mod = {};

  var loggedIn = $(".header-logged-in");

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

  function viewOfToDoPopover() {
'''
<div #view class="popover-content">
  <div #accountInfo class="popover-account-info">
    <div #accountName class="popover-account-name ellipsis"/>
    <div #accountEmail class="popover-account-email ellipsis"/>
  </div>
  <ul #teamList class="popover-team-list popover-list"></ul>
  <ul #accountActions" class="popover-list">
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

  function viewOfNotificationsPopover() {
'''
<div #view class="popover-content">
  <div #accountInfo class="popover-account-info">
    <div #accountName class="popover-account-name ellipsis"/>
    <div #accountEmail class="popover-account-email ellipsis"/>
  </div>
  <ul #teamList class="popover-team-list popover-list"></ul>
  <ul #accountActions" class="popover-list">
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

  function clickableViewOfTeam(team) {
    var isActive = login.getTeam().teamname === team.teamname;
    var label = labelOfTeam(team);
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
      clickableViewOfTeam(team)
        .appendTo(view);
    });
  }

  function viewOfAccountPopover() {
'''
<div #view class="popover-content">
  <div class="popover-account-info">
    <div #accountName class="popover-account-name ellipsis"/>
    <div #accountEmail class="popover-account-email ellipsis"/>
  </div>
  <div>Use Esper to assist:</div>
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
    accountPopover.children().remove();
    accountPopover.removeClass("open")
                  .attr("style","display:none");
    loggedIn.children().remove();
    loggedIn.addClass("hide");
  }

  mod.load = function() {
'''
<div #view>
  <div class="header-account">
    <div #accountArrow class="header-account-arrow"/>
    <div #accountPopover class="header-account-popover"
         style="display:none"/>
  </div>
  <div #assisting class="header-assisting"/>
  <div #notifications class="header-notifications">
    <div #notificationsIcon class="header-notifications-icon unread"/>
    <div #notificationsCount class="header-notifications-count">5</div>
    <div #notificationsPopover class="header-notifications-popover"
         style="display:none"/>
  </div>
  <div #toDo class="header-to-do">
    <div #toDoIcon class="header-to-do-icon incomplete"/>
    <div #toDoCount class="header-to-do-count">2</div>
    <div #toDoPopover class="header-to-do-popover"
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
        if (accountPopover.hasClass("open")) {
          accountPopover
            .removeClass("open")
            .attr("style","display:none");
        } else {
          accountPopover
            .addClass("open")
            .attr("style","display:block");
        }
      })

    accountPopover
      .removeClass("open")
      .attr("style","display:none");
    loggedIn
      .append(view)
      .removeClass("hide");
  };

  return mod;
}());
