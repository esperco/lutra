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

function showTasks(tasktype, list){
  $(tasktype).hover(function(){
      $(list).slideDown('medium');
    }, function() {
      $(list).slideUp('medium');
    }
  );
}

function limitRedeemInput(){
  $("#redeem-code").keydown(function(e){
    // Allow: backspace, delete, tab, escape, enter and .
    if (($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1) ||
        // Allow: Ctrl+A
        (e.keyCode == 65 && e.ctrlKey === true) ||
        // Allow: home, end, left, right
        (e.keyCode >= 35 && e.keyCode <= 39)) {
      // let it happen, don't do anything
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57))
        && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  });
}

function looksLikeAnEmailAddress(s) {
  return (/^[^ @]+@{1}[^ @]+[.]{1}[^ .@]+$/.test(s));
}

function checkAndSubmitRedeemForm() {
  $("#redeem-form").submit(function(e){
    var firstName = $("#first-name").val();
    var lastName = $("#last-name").val();
    var code = $("#redeem-code").val();
    var email = $("#email").val();
    var emailPlatform = $("#platform").val();
    var valid = true;
    if (code.length != 9) {
      valid = false;
      $("#redeem-code").addClass("incorrect");
    }
    else
      $("#redeem-code").removeClass("incorrect");

    if (firstName.length === 0) {
      valid = false;
      $("#first-name").addClass("incorrect");
    }
    else
      $("#first-name").removeClass("incorrect");

    if (lastName.length === 0) {
      valid = false;
      $("#last-name").addClass("incorrect");
    }
    else
      $("#last-name").removeClass("incorrect");

    if (! looksLikeAnEmailAddress(email)) {
      valid = false;
      $("#email").addClass("incorrect");
    }
    else
      $("#email").removeClass("incorrect");

    if (!valid)
      e.preventDefault();
    else {
      var url =
        "https://app.esper.com/#!redeem/" + encodeURIComponent(code)
        + "/" + encodeURIComponent(email)
        + "/" + encodeURIComponent(firstName + " " + lastName)
        + "/" + encodeURIComponent(emailPlatform);
      console.log(url);
      open(url);
    }
  });
}

function setupRedeemForm() {
  limitRedeemInput();
  checkAndSubmitRedeemForm();
}

function changeSubmitButtonType(s) {
    $("#signup-btn").prop("type", s);
}

function checkAndSubmitSignupForm() {
  $("#signup-btn").click(function(e){
    var firstName = $("#first-name").val();
    var lastName = $("#last-name").val();
    var phone = $("#phone").val();
    var email = $("#email").val();
    var emailPlatform = $("#platform").val();
    var valid = true;

    if (firstName.length === 0) {
      valid = false;
      $("#first-name").addClass("incorrect");
    }
    else
      $("#first-name").removeClass("incorrect");

    if (lastName.length === 0) {
      valid = false;
      $("#last-name").addClass("incorrect");
    }
    else
      $("#last-name").removeClass("incorrect");

    if (phone.length === 0) {
      valid = false;
      $("#phone").addClass("incorrect");
    }
    else
      $("#phone").removeClass("incorrect");

    if (! looksLikeAnEmailAddress(email)) {
      valid = false;
      $("#email").addClass("incorrect");
    }
    else
      $("#email").removeClass("incorrect");
    
    if (emailPlatform === null) {
      valid = false;
      $("#platform").addClass("incorrect");
    }
    else
      $("#platform").removeClass("incorrect");


    if (!valid)
      e.preventDefault();
    else {
      if (emailPlatform !== "Google Apps") {
        changeSubmitButtonType("submit");
       // var url = "http://localhost:8009/pub/signup-sorry"
      }
      else {
        changeSubmitButtonType("button");
      var url =
        "https://app.esper.com/#!signup/" + encodeURIComponent(firstName)
        + "/" + encodeURIComponent(lastName)
        + "/" + encodeURIComponent(phone)
        + "/" + encodeURIComponent(email)
        + "/" + encodeURIComponent(emailPlatform);
      console.log(url);
      }
      //open(url);
      window.location = url;
    }
  });
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

function queryParams() {
  var q = window.location.search.slice(1).split(/&/);
  var args = [];
  for (var i in q) {
    var a = q[i].split(/=/);
    if (a.length == 1) {
      args.push(a);
    } else if (a.length > 1) {
      args.push([a[0], decodeURIComponent(a[1])]);
    }
  }
  return args;
}

function prefillSignupForm() {
  var args = queryParams();
  for (var i in args) {
    switch (args[i][0]) {
    case "first":
      $("#first-name").val(args[i][1]);
      break;
    case "last":
      $("#last-name").val(args[i][1]);
      break;
    case "email":
      $("#email").val(args[i][1]);
      break;
    case "code":
      $("#redeem-code").val(args[i][1]);
      break;
    }
  }
}

function main() {
  loadElements();
  resizer();
  slider();
  setupRedeemForm();
  checkAndSubmitSignupForm();
 }


$(document).ready(main);
