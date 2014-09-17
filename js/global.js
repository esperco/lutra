function slider() {
  $(window).scroll(slideNavbar);

  function slideNavbar() {
    if (document.body.scrollTop >= 400)
      $(".navbar-container").slideDown();
    else
      $(".navbar-container").slideUp();
  }

  $(".index-navbar-container").hide();
  $(".navbar-container").hide();
  slideNavbar();
}

function resizer() {
  var splash = $(".splash");

  window.addEventListener("resize", resizeCanvas, false);

  function resizeCanvas() {
    if (window.innerWidth < 800) {
      splash
        .css("clip", "auto")
        .css("margin-left", (window.innerWidth - 800)/2 + "px");
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
  $(".splash-navbar").load("splash-navbar.html");
}

function main() {
  loadElements();
  resizer();
  slider();
}

$(document).ready(main);
