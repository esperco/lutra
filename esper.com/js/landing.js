function slackSignIn() {
  var xhr = new XMLHttpRequest();
  var api_url = Esper.PRODUCTION ?
    "https://app.esper.com/api/slack/app-info" :
    "http://127.0.0.1/api/slack/app-info";

  xhr.open("GET", api_url);
  xhr.send();

  xhr.onloadend = function() {
    if (xhr.status == 200) {
      var body = JSON.parse(xhr.responseText);
      var url = "https://slack.com/oauth/authorize?" +
        "client_id=" + body.client_id +
        "&scope=" + body.id_scope +
        "&redirect_uri=" + encodeURIComponent(body.redirect_uri);
      window.location = url;
    }
  }
}

function sandboxSignup() {
  var buttons = document.getElementsByClassName("try-esper-btn");

  for (var i = 0; i < buttons.length; i++) {
    var button = buttons[i];
    var span = document.createElement("span");
    span.style = "display: inline-block; height: 20px; width: 20px; margin: 0;";
    span.className = "esper-spinner";
    button.appendChild(span);
  }

  var xhr = new XMLHttpRequest();
  var base_url = Esper.PRODUCTION ?
    "https://app.esper.com" : "http://127.0.0.1";
  var api_url = base_url + "/api/sandbox/signup";
  xhr.open("POST", api_url);
  xhr.send();

  xhr.onloadend = function() {
    if (xhr.status == 200) {
      var body = JSON.parse(xhr.responseText);
      var stored = JSON.stringify({
        uid: body.uid,
        api_secret: body.api_secret,
        email: body.email
      });
      var secure = location.protocol === "http:" ? "" : "; secure";

      try {
        localStorage.setItem("login", stored);
      } catch (err) {}
      document.cookie = "login=" + stored + "; path=/" + secure;
      location.href = "/time";
    }
  }
}

function toggleNavMenu() {
  if ($(".nav-menu").css("display") === "none") {
    $(".nav-menu").fadeIn("fast");
    $(document.body).css("overflow-y", "hidden");
  } else {
    $(".nav-menu").fadeOut("fast");
    $(document.body).css("overflow-y", "auto");
  }
}

// If user is already logged in, update sign in links depending on whether
// they're a groups user or not
function updateLoginLinks() {
  try {
    let login = JSON.parse(localStorage.getItem('login'));
    if (login && login.uid) {
      let signInLinks = $("a.esper-sign-in");
      if (localStorage.getItem('groups') === 'true') {
        signInLinks.attr('href', 'groups');
      } else {
        signInLinks.attr('href', 'time');
      }
    }
  } catch (err) {
    // Ignore - probably either no localStorage or stored login isn't
    // valid JSON.
  }
}

function loadElements() {
  $(".nav-menu").click(function() { toggleNavMenu(); });
  $(".navbar-toggle").click(function() { toggleNavMenu(); });
  $(".slack-btn").click(function() { slackSignIn(); });
  $(".try-esper-btn").click(function() { sandboxSignup(); });
  updateLoginLinks();
}

function main() {
  loadElements();
}

$(document).ready(main);
