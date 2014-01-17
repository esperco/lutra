/*
  Window-level settings
*/

var display = (function() {
  var mod = {};

  mod.updateHome = function() {

    /*** Settings ***/
    if ($(window).width() < 500) {
      $('.email-address').removeClass('desktop')
                         .addClass('mobile');
      $('.primary-label-mobile').removeClass('hide');
      $('.email-actions-desktop').addClass('hide');
      $('.email-actions-mobile').removeClass('hide');
      $('.linked-account-email').addClass('hide');
      $('.extended-name').addClass('hide');
    } else {
      $('.email-address').addClass('desktop')
                         .removeClass('mobile');
      $('.primary-label-mobile').addClass('hide');
      $('.email-actions-desktop').removeClass('hide');
      $('.email-actions-mobile').addClass('hide');
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
    } else {
      $('#desktop-navbar').removeClass('hide');
      $('#mobile-navbar').addClass('hide');
      $('.mobile-nav-tabs').removeClass('nav-tabs-centered');
      $('.home-container').addClass('navbar-open');
      $('#home-push').addClass('hide');
      $('.page-title').removeClass('hide');
      $('.new-task-btn').removeClass('hide');
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
    if ($(window).width() < 620) {
      $('.send-message-text').addClass('hide');
    } else {
      $('.send-message-text').removeClass('hide');
    }
  };

  mod.checkWidth = function() {
    if (!$('#home-page').hasClass('hide'))
      mod.updateHome();

    if (!$('#task-page').hasClass('hide'))
      mod.updateTask();

    if ($(window).width() < 620) {
      $('#login-container')
        .removeClass('desktop-login')
        .addClass('mobile-login');
      $('.container').addClass('mobile');
    } else {
      $('#login-container')
        .removeClass('mobile-login')
        .addClass('desktop-login');
      $('.container').removeClass('mobile');
    }
  };

  mod.init = function() {
    $("[data-toggle='tooltip']").tooltip();
    mod.checkWidth();
    $(window).resize(mod.checkWidth);
  };

  return mod;
}());
