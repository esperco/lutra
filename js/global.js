function toggleNavMenu() {
  if ($(".nav-menu").css("display") === "none") {
    $(".nav-menu").fadeIn("fast");
    $(document.body).css("overflow-y", "hidden");
  } else {
    $(".nav-menu").fadeOut("fast");
    $(document.body).css("overflow-y", "auto");
  }
}

function slider() {
  $(window).scroll(slideNavbar);

  function slideNavbar() {
    if (window.innerWidth < 768) {
      if (document.body.scrollTop >= 325)
        $(".navbar-container-mobile").slideDown();
      else
        $(".navbar-container-mobile").slideUp();
    } else {
      if (document.body.scrollTop >= 325)
        $(".navbar-container").slideDown();
      else
        $(".navbar-container").slideUp();
    }
  }

  $(".index-navbar-container").hide();
  $(".navbar-container").hide();
  $(".navbar-container-mobile").hide();
  slideNavbar();
}

function resizer() {
  var splash = $(".splash");

  window.addEventListener("resize", resizeCanvas, false);

  function resizeCanvas() {
    if (window.innerWidth < 800) {
      var offset = Math.abs(window.innerWidth - 800)/2;
      splash
        .css("clip", "rect(0px," + (window.innerWidth + offset) + "px,400px," + offset + "px)")
        .css("margin-left", -offset + "px");
    } else {
      splash
        .css("clip", "rect(0," + window.innerWidth + "px,400px,0)")
        .css("margin-left", 0);
    }
  }

  resizeCanvas();
}

function loadElements() {
  $(".footer-container").load("footer.html");
  $(".navbar-container").load("navbar.html");
  $(".splash-navbar.desktop").load("splash-navbar.html");
  $(".nav-menu").load("nav-menu.html");
}

function main() {
  loadElements();
  resizer();
  slider();
  $(".nav-menu-toggle").click(function() { toggleNavMenu(); });
  $(".nav-menu").click(function() { toggleNavMenu(); });
}

$(document).ready(main);
