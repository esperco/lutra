/*
  Home page (task lists)
*/

var header = (function() {
  var mod = {};

  var menu = $(".account-menu");
  var popover = $(".account-popover");

  function loadMenu() {
'''
<div #view>
  <div #arrowContainer class="account-menu-arrow"/>
  <div #name class="assisting-name"/>
  <div #circ class="assisting-circ"/>
</div>
'''
    var arrow = $("<img class='svg-block'/>")
      .appendTo(arrowContainer);
    svg.loadImg(arrow, "/assets/img/arrow-south.svg");

    profile.get(login.leader()).done(function(obsProf) {
      var p = obsProf.prof;
      var fullName = profile.fullName(p);
      circ.text(profile.shortenName(fullName).substring(0,1).toUpperCase());
      name.text(fullName);
    });

    menu
      .off("click")
      .click(function() {
        if (popover.hasClass("open")) {
          popover.removeClass("open")
                 .attr("style","display:none");
        } else {
          popover.addClass("open")
                 .attr("style","display:block");
        }
      })

    menu.children().remove();
    menu.append(view);
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

  function loadAccountPopover() {
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

    popover.children().remove();
    popover.append(view);
  }

  mod.clear = function() {
    popover.children().remove();
    popover.removeClass("open")
           .attr("style","display:none");
    menu.children().remove();
    menu.addClass("hide");
  }

  mod.load = function() {
    loadAccountPopover();
    popover.removeClass("open")
       .attr("style","display:none");
    loadMenu();
    menu.removeClass("hide");
  };

  return mod;
}());
