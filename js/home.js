function slider() {
  $(window).scroll(slideNavbar);

  function slideNavbar() {
    if (document.body.scrollTop >= window.innerHeight)
      $(".index-navbar-container").slideDown();
    else
      $(".index-navbar-container").slideUp();
  }

  $(".index-navbar-container").hide();
  slideNavbar();
}

function scroller() {
  $("a[href*=#]").click(function() {
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'')
    && location.hostname == this.hostname) {
      var $target = $(this.hash);
      $target = $target.length && $target
      || $("[name=" + this.hash.slice(1) +"]");
      if ($target.length) {
        var targetOffset = $target.offset().top;
        $("html,body")
        .animate({scrollTop: targetOffset}, 250);
       return false;
      }
    }
  });

  $("a[href=#join-scroll]").click(function() { $("#mce-FNAME").focus(); });
}

function resizer() {
  var fullSplash = $(".full-splash");
  var fullSplashWidth = 1920;
  var fullSplashText = $(".splash-text");
  var imgRatio = 720/1920;

  window.addEventListener("resize", resizeCanvas, false);

  function resizeCanvas() {
    var windowRatio = window.innerHeight/window.innerWidth;
    console.log("imgRatio: " + imgRatio);
    console.log("windowRatio: " + windowRatio);
    if (windowRatio < imgRatio) {
      fullSplash
        .css("width", "100%")
        .css("height", "auto")
        .css("margin-left", 0);
    } else {
      fullSplash
        .css("width", "auto")
        .css("height", "100%")
        .css("margin-left", -Math.abs(window.innerWidth - fullSplashWidth)/2 + "px");
    }
    fullSplashText
      .css("margin-top", (window.innerHeight - fullSplashText.height())/3 + "px");
  }

  resizeCanvas();
}

function loadElements() {
  $(".footer-container").load("footer.html");
  $(".index-navbar-container").load("navbar.html");
  $(".splash-navbar").load("splash-navbar.html");
}

function main() {
  loadElements();
  resizer();
  scroller();
  slider();
}

$(document).ready(main);
