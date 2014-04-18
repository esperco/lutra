/*
  Window-level settings
*/

var display = (function() {
  var mod = {};

  mod.updateSettings = function() {
    if ($(window).width() < 500) {
      $('.email-address').removeClass('desktop')
                         .addClass('mobile');
      $('.linked-account-email').addClass('hide');
      $('.extended-name').addClass('hide');
    } else {
      $('.email-address').addClass('desktop')
                         .removeClass('mobile');
      $('.linked-account-email').removeClass('hide');
      $('.extended-name').removeClass('hide');
    }
  };

  mod.checkWidth = function() {
    if ($(window).width() < 620) {
      $('.container').addClass('mobile');
    } else {
      $('.container').removeClass('mobile');
    }

    if ($(window).width() < 432) {
      $('.login-container')
        .removeClass('desktop-login-container')
        .addClass('mobile-login-container');
      $('.login-form')
        .removeClass('desktop-login-form')
        .addClass('mobile-login-form');
    } else {
      $('.login-container')
        .removeClass('mobile-login-container')
        .addClass('desktop-login-container');
      $('.login-form')
        .removeClass('mobile-login-form')
        .addClass('desktop-login-form');
    }
  };

  mod.init = function() {
    $("[data-toggle='tooltip']").tooltip();
    mod.checkWidth();
    $(window).resize(mod.checkWidth);
  };

  return mod;
}());
