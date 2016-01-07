function toggleNavMenu() {
  if ($(".nav-menu").css("display") === "none") {
    $(".nav-menu").fadeIn("fast");
    $(document.body).css("overflow-y", "hidden");
  } else {
    $(".nav-menu").fadeOut("fast");
    $(document.body).css("overflow-y", "auto");
  }
}

function resizer() {
  var splash = $(".splash");

  window.addEventListener("resize", resizeCanvas, false);

  function resizeCanvas() {
    if (window.innerWidth < 800) {
      var offset = Math.abs(window.innerWidth - 800)/2;
      splash
        .css("clip", "rect(0px," + (window.innerWidth + offset) + "px,400px,"
          + offset + "px)")
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
  $(".nav-menu").click(function() { toggleNavMenu(); });
  $(".nav-menu-toggle").click(function() { toggleNavMenu(); });
}

function main() {
  loadElements();
  resizer();
}

$(document).ready(main);
