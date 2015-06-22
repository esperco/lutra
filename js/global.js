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
  return (/^[^ ]+@[^ ]+$/.test(s));
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

    if (!valid)
      e.preventDefault();
    else {
      var url =
        "https://localhost/#!signup/" + encodeURIComponent(firstName)
        + "/" + encodeURIComponent(lastName)
        + "/" + encodeURIComponent(phone)
        + "/" + encodeURIComponent(email)
        + "/" + encodeURIComponent(emailPlatform);
      console.log(url);
      //open(url);
      window.location = url;
    }
  });
}

function main() {
  loadElements();
  resizer();
  slider();
  setupRedeemForm();
  checkAndSubmitSignupForm();
  // Disabling these hover-lists because they seem gimmicky and make it harder for users to understand
  // showTasks(".tasks-left-col", "ul.event-examples");
  // showTasks(".tasks-mid-col", "ul.research-examples");
  // showTasks(".tasks-right-col", "ul.office-examples");
}


$(document).ready(main);
