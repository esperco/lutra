/*
  Esper menu that is accessible from any Gmail view.
  (on the right hand side of the top bar)
*/

module Esper.Menu {
  /*
    Find a good insertion point.
    We return the element containing the name of the logged-in user,
    e.g. "+Peter". The Esper menu is inserted right after that element.
  */
  function findAnchor() {
    var anchor = $("div.gb_sc.gb_f.gb_Ic.gb_Ac");
    if (anchor.length !== 1) {
      Log.e("Cannot find anchor point for the Esper menu.");
      return $();
    }
    else
      return anchor;
  }

  function replace(menu: JQuery) {
    var leftSibling = findAnchor();
    if (leftSibling.length === 1) {
      $("#esper-menu").remove();
      menu.insertAfter(leftSibling);
      return true;
    }
    else
      return false;
  }

  function makeActionLink(text, action, danger) {
    var link = $("<li class='esper-li'/>")
      .text(text)
      .click(action);

    if (danger) link.addClass("danger");

    return link;
  }

  function makePopupLink(text, url) {
    return $("<li class='esper-li'/>")
      .text(text)
      .click(function() {
        MsgView.popWindow(url, 545, 433);
      });
  }

  function updateLinks(ul) {
    var loggedIn = Login.loggedIn();

    var signInLink = loggedIn?
      makeActionLink("Sign out", Login.logout, true)
      : makeActionLink("Sign in", Init.login, false);

    var settingsLink = makePopupLink("Settings", Conf.Api.url);

    var helpLink = $("<a class='esper-a'>Help</a>")
      .attr("href", "mailto:team@esper.com");

    ul.children().remove();
    ul
      .append(signInLink)
      .append(settingsLink)
      .append(helpLink);
  }

  /*
    Create and inject the Esper menu.
    It is safe to call this function multiple times. Any old Esper menu
    is removed first.
   */
  export function create() {
'''
<div #view id="esper-menu" class="esper-menu">
  <img #logo class="esper-click-safe esper-dropdown-btn esper-menu-logo"/>
  <div #background class="esper-menu-bg"/>
  <img #caret class="esper-caret"/>
  <ul #dropdown class="esper-ul esper-menu-dropdown">
    <div #dropdownContent class="esper-dropdown-section"/>
  </ul>
</div>
'''

    var theme = $("div.gb_Dc.gb_sb");
    if (theme.hasClass("gb_l")) {
      logo.attr("src", Init.esperRootUrl + "img/menu-logo-white.png")
          .addClass("esper-menu-white");
    } else {
      logo.attr("src", Init.esperRootUrl + "img/menu-logo-black.png")
          .addClass("esper-menu-black");
    }

    caret.attr("src", Init.esperRootUrl + "img/caret.png");

    updateLinks(dropdownContent);

    logo.click(function() {
      if (logo.hasClass("open")) {
        MsgView.dismissDropdowns();
      } else {
        MsgView.dismissDropdowns();
        background.toggle();
        caret.toggle();
        dropdown.toggle();
        logo.addClass("open");
      }
    });

    Util.repeatUntil(100, 1000, function() {
      Log.d("Inserting Esper menu...");
      var success = replace(view);
      if (success)
        Log.d("Esper menu is now ready.");
      return success;
    });

    return dropdownContent; /* .append <li> items to it */
  }
}
