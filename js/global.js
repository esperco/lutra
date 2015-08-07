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
  var alias_name = location.hash.split("#")[1].split("@")[0];
  var formatted_name = alias_name.charAt(0).toUpperCase() + alias_name.slice(1);
  var greeting =  "Hi ".concat(formatted_name).concat(",");
  document.getElementById("alias-name").innerHTML = greeting;

  var user = location.hash.split('#')[2];
  document.getElementById("user").innerHTML = user;

  var email = location.hash.split("#")[1];
  var intro_email = "https://mail.google.com/mail/u/0/?view=cm&fs=1&to=".concat(email).concat("&su=Nice%20to%20meet%20you,%20").concat(formatted_name).concat("&body=").concat(greeting).concat("%0D%0A%0D%0AGreat%20to%20meet%20you!%20I%27m%20excited%20to%20have%20you%20as%20an%20assistant.%0D%0AI%27d%20love%20to%20speak%20with%20you%20and%20learn%20more%20about%20what%20you%20can%20do%20for%20me.%0D%0ACan%20you%20help%20find%20a%20good%20time%20for%20a%20phone%20call%20that%20works%20for%20both%20of%20us?%0D%0A%0D%0ACheers,%0D%0A").concat(user);
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
