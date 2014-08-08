/*
  Esper menu that is accessible from any Gmail view.
  (on the right hand side of the top bar)
*/

module Esper.Menu {

  function dismissDropdowns() {
    if ($(".esper-add-btn").hasClass("open"))
      $(".no-events-arrow").toggle();
    $(".esper-ul").attr("style", "display: none");
    $(".esper-menu-bg").attr("style", "display: none");
    $(".esper-caret").attr("style", "display: none");
    $(".esper-dropdown-btn").removeClass("open");
  }

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

function popWindow(url, width, height) {
  var leftPosition, topPosition;
  //Allow for borders.
  leftPosition = (window.screen.width / 2) - ((width / 2) + 10);
  //Allow for title and status bars.
  topPosition = (window.screen.height / 2) - ((height / 2) + 50);

  window.open(url, "Window2", "status=no,height="
    + height + ",width=" + width + ",resizable=yes,left="
    + leftPosition + ",top=" + topPosition + ",screenX="
    + leftPosition + ",screenY=" + topPosition
    + ",toolbar=no,menubar=no,scrollbars=no,location=no,directories=no");
}

  function makeActionLink(text, action, danger) {
    var link = $("<li class='esper-li'/>")
      .text(text)
      .click(action);

    if (danger) link.addClass("danger");

    return link;
  }

  function makeHyperLink(text, url) {
    return $("<li class='esper-li'/>")
      .text(text)
      .click(function() {
        popWindow(url, 545, 433)
       });
  }

  function updateLinks(ul) {
    var loggedIn = Login.loggedIn();

    var enableLink = loggedIn?
      makeActionLink("Disable Esper", Login.logout, true)
      : makeActionLink("Enable Esper", Init.login, false);

    var settingsLink = makeHyperLink("Settings", Conf.Api.url);

    var helpLink = $("<a class='esper-a'>Help</li>")
      .attr("href", "mailto:team@esper.com");

    ul.children().remove();
    ul
      .append(enableLink)
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
<div #view class="esper-menu">
  <img #logo class="esper-dropdown-btn esper-menu-logo"/>
  <div #background class="esper-menu-bg"/>
  <div class="esper-menu-dropdown">
    <ul #dropdown class="esper-ul"/>
    <img #caret class="esper-caret"/>
  </div>
</div>
'''

    var theme = $("div.gb_Dc.gb_sb");
    if (theme.hasClass("gb_l")) {
      logo.attr("src", Init.esperRootUrl + "img/menu-logo-white.png")
          .addClass("white");
    } else {
      logo.attr("src", Init.esperRootUrl + "img/menu-logo-black.png")
          .addClass("black");
    }

    caret.attr("src", Init.esperRootUrl + "img/caret.png")

    updateLinks(dropdown);

    logo.click(function() {
      if (logo.hasClass("open")) {
        dismissDropdowns();
      } else {
        dismissDropdowns();
        background.toggle();
        caret.toggle();
        dropdown.toggle();
        logo.addClass("open");
      }
    })

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
