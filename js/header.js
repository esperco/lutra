/*
  Home page (task lists)
*/

var header = (function() {
  var mod = {};

  var menu = $(".account-menu");
  var popover = $(".account-popover");

  function loadMenu() {
    profile.get(login.leader()).done(function(obsProf) {
      var circ = $("#assisting-circ");
      var name = $("#assisting-name");
      var p = obsProf.prof;
      var fullName = profile.fullName(p);
      circ.text(profile.shortenName(fullName).substring(0,1).toUpperCase());
      name.children().remove();
      name.text(fullName);
    });

    menu.click(function() {
      if (popover.hasClass("open")) {
        popover.removeClass("open")
               .attr("style","display:none");
      } else {
        popover.addClass("open")
               .attr("style","display:block");
      }
    })

    $('body').on('click', function (e) {
      if ($(e.target) == popover) {
        menu.click();
      }
    });
  }

  function switchTeam(team) {
    log("Switching");
    login.setTeam(team);
    mod.load();
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
    var a = $("<a href='#' data-toggle='pill'/>")
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
      log("Not active");
      li.click(function() {
        log("switch");
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

  function loadAccountPopover() {
'''
<div #view>
  <div #accountInfo>
    <div #accountName class="popover-account-name ellipsis"/>
    <div #accountEmail class="popover-account-email ellipsis"/>
  </div>
  <ul #teamList class="popover-team-list"></ul>
  <ul #accountActions" class="popover-team-list">
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

    popover.children().remove();
    popover.append(view);
  }

  mod.load = function() {
    loadAccountPopover();
    loadMenu();
    menu.removeClass("hide");
  };

  return mod;
}());
