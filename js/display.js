/*
  Window-level settings
*/

var display = (function() {
  var mod = {};

  mod.updateHome = function() {
    /*
      Hiding/styling elements differently for mobile and desktop.

      TODO:
      This should be done without Javascript by conditional inclusion
      of CSS files in the <head> section of the HTML document.
      Here is an example:

      <link rel="stylesheet" type="text/css" href="/assets/css/desktop.css"/>
      <link rel="stylesheet" type="text/css" href="/assets/css/mobile.css"
            media="only screen and (max-device-width: 800px)"/>

     */


    /*** Settings ***/
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


    /*** Places ***/
    if ($(window).width() < 532) {
      $('.place-details')
        .removeClass('col-xs-5')
        .addClass('col-xs-10');
      $('.stats').addClass('hide');
      $('.mobile-stats').removeClass('hide');
      $('.last-visit').addClass('mobile');
      $('.visits').addClass('mobile');
      $('.place-actions')
        .removeClass('desktop')
        .removeClass('col-xs-4')
        .addClass('col-xs-2');
    } else {
      $('.place-details')
        .removeClass('col-xs-10')
        .addClass('col-xs-5');
      $('.stats').removeClass('hide');
      $('.mobile-stats').addClass('hide');
      $('.last-visit').removeClass('mobile');
      $('.visits').removeClass('mobile');
      $('.place-actions')
        .removeClass('col-xs-2')
        .addClass('col-xs-4')
        .addClass('desktop');
    }

    /*** Home ***/
    if ($(window).width() < 768) {
      $('#desktop-navbar').addClass('hide');
      $('#mobile-navbar').removeClass('hide');
      $('.mobile-nav-tabs').addClass('nav-tabs-centered');
      $('.home-container').removeClass('navbar-open');
      $('#home-push').removeClass('hide');
      $('.page-title').addClass('hide');
      $('.new-task-btn').addClass('hide');
      $('.new-place-btn').addClass('hide');
    } else {
      $('#desktop-navbar').removeClass('hide');
      $('#mobile-navbar').addClass('hide');
      $('.mobile-nav-tabs').removeClass('nav-tabs-centered');
      $('.home-container').addClass('navbar-open');
      $('#home-push').addClass('hide');
      $('.page-title').removeClass('hide');
      $('.new-task-btn').removeClass('hide');
      $('.new-place-btn').removeClass('hide');
    }

    if ($(window).width() < 992) {
      $('.desktop-nav-tabs').addClass('hide');
      $('.mobile-nav-tabs').removeClass('hide');
    } else {
      $('.desktop-nav-tabs').removeClass('hide');
      $('.mobile-nav-tabs').addClass('hide');
    }

    /*** Lists ***/

    if ($(window).width() < 768) {
      $('.task-details').addClass('mobile');
      $('.archive-div').addClass('mobile');
    } else {
      $('.task-details').removeClass('mobile');
      $('.archive-div').removeClass('mobile');
    }
  };

  mod.updateTask = function() {
    if ($(window).width() < 365) {
      $('.pref-prof-circ').addClass('mobile');
      $('.pref-guest-name').addClass('hide');
      $('.required').addClass('mobile');
      $('.pref-guest-actions').removeClass('desktop');
    } else {
      $('.pref-prof-circ').removeClass('mobile');
      $('.pref-guest-name').removeClass('hide');
      $('.required').removeClass('mobile');
      $('.pref-guest-actions').addClass('desktop');
    }
  };

  mod.checkWidth = function() {
    if (!$('#home-page').hasClass('hide'))
      mod.updateHome();

    if (!$('#task-page').hasClass('hide'))
      mod.updateTask();

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
