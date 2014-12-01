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
    if (document.body.scrollTop >= 325)
      $(".navbar-container").slideDown();
    else
      $(".navbar-container").slideUp();
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
  $(".nav-menu").load("nav-menu.html");
  $(".navbar-container").load("navbar.html", function() {
    $(".splash-navbar").load("splash-navbar.html", function() {
      $(".nav-menu").click(function() { toggleNavMenu(); });
      $(".nav-menu-toggle").click(function() { toggleNavMenu(); });
    });
  });
  $(".about-navbar").load("about-navbar.html", function() {
    var page = $(".about-navbar").attr("id");
    $("." + page).addClass("active");
  })
  $(".footer-container").load("footer.html");
}

function showTasks(tasktype, list){
  $(tasktype).hover(function(){
      $(list).slideDown('medium');
    }, function() {
      $(list).slideUp('medium');
    }
  );
}

function main() {
  loadElements();
  resizer();
  slider();
  showTasks(".tasks-left-col", "ul.event-examples");
  showTasks(".tasks-mid-col", "ul.research-examples");
  showTasks(".tasks-right-col", "ul.office-examples");
}




$(document).ready(main);
