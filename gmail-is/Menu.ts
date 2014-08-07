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

  function makeActionLink(text, action) {
'''
<li #li class="esper-menu-clickable">
  <a #a href="#"></a>
</li>
'''
    a
      .text(text)
      .click(action);
    return li;
  }

  function makeHyperLink(text, url) {
'''
<li #li class="esper-menu-clickable">
  <a #a target="_blank"></a>
</li>
'''
    a
      .text(text)
      .attr("href", url);
    return li;
  }

  function makeDisabledLink(text) {
    return $("<li/>").text(text);
  }

  function updateLinks(ul) {
    var loggedIn = Login.loggedIn();

    var loginLink = loggedIn?
      makeDisabledLink("Sign into Esper")
      : makeActionLink("Sign into Esper", Init.login);

    var logoutLink = loggedIn?
      makeActionLink("Sign out of Esper", Login.logout)
      : makeDisabledLink("Sign out of Esper");

    var settingsLink = makeHyperLink("Settings", Conf.Api.url);

    ul.children().remove();
    ul
      .append(loginLink)
      .append(logoutLink)
      .append(settingsLink);
  }

  /*
    Create and inject the Esper menu.
    It is safe to call this function multiple times. Any old Esper menu
    is removed first.
   */
  export function create() {
'''
<div #view id="esper-menu" class="esper-menu">
  <img #logo/>
  <div #background class="esper-menu-bg esper-hide"/>
  <ul #dropdown class="esper-menu-dropdown"/>
</div>
'''
    logo.attr("src", Init.esperRootUrl + "img/logo-footer.png");

    updateLinks(dropdown);

    function hide() {
      background.addClass("esper-hide");
      dropdown.removeClass("esper-menu-dropdown-visible");
    }

    function show() {
      background.removeClass("esper-hide");
      dropdown.addClass("esper-menu-dropdown-visible");
    }

    background.click(hide);
    dropdown.click(hide);
    logo.click(show);

    Util.repeatUntil(100, 1000, function() {
      Log.d("Inserting Esper menu...");
      var success = replace(view);
      if (success)
        Log.d("Esper menu is now ready.");
      return success;
    });

    return dropdown; /* .append <li> items to it */
  }
}
