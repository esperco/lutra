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
  $(".nav-menu").load("nav-menu");
  $(".navbar-container").load("navbar", function() {
    $(".splash-navbar").load("splash-navbar", function() {
      $(".nav-menu").click(function() { toggleNavMenu(); });
      $(".nav-menu-toggle").click(function() { toggleNavMenu(); });
    });
  });
  $(".about-navbar").load("about-navbar", function() {
    var page = $(".about-navbar").attr("id");
    $("." + page).addClass("active");
  })
  $(".footer-container").load("footer");
}

function setDonePageFromHash() {
  var hash = location.hash.slice(1);
  var alias_name = hash.split(";")[0].split("@")[0];
  var formatted_name = alias_name.charAt(0).toUpperCase() + alias_name.slice(1);
  var greeting =  "Hi ".concat(formatted_name).concat(",");
  document.getElementById("alias-name").innerHTML = greeting;

  var user = hash.split(';')[1];
  document.getElementById("user").innerHTML = user;

  var email = hash.split(";")[0];
  var intro_email = "mailto:".concat(email).concat("?subject=Nice to meet you, ").concat(formatted_name).concat("!&body=").concat(greeting).concat("%0D%0A%0D%0AIt's great to meet you! I'm excited to have you as an assistant.%0D%0AI'd love to speak with you and learn more about what you can do for me.%0D%0ACan you help find a good time for a phonecall that works for both of us?%0D%0A%0D%0ACheers,%0D%0A").concat(user);
  document.getElementById("mailto-link").innerHTML = email;
  $("#mailto-link").prop("href", intro_email);
  $("#mailto-msg").prop("href", intro_email);
}

function main() {
  loadElements();
  resizer();
  slider();
 }

$(document).ready(main);
