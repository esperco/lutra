/*
  Window-level settings
*/

var display = (function() {
  var mod = {};

  mod.updateHome = function() {
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
  };

  mod.updateChat = function() {
    if ($(window).width() < 768) {
      $('#task-navbar')
        .removeClass('col-sm-8 split-screen')
        .addClass('navbar-fixed-top');
      $('.new-task-footer')
        .removeClass('col-sm-8 split-screen')
        .addClass('navbar-fixed-bottom');
      $('.sched-footer')
        .removeClass('col-sm-8 split-screen')
        .addClass('navbar-fixed-bottom');
      $('#chat').addClass('hide');
      $('#chat-icon-container').removeClass('hide');
      $('#task-content').removeClass('split-screen');
    } else {
      $('#task-navbar')
        .removeClass('navbar-fixed-top')
        .addClass('col-sm-8 split-screen');
      $('.new-task-footer')
        .removeClass('navbar-fixed-bottom')
        .addClass('col-sm-8 split-screen');
      $('.sched-footer')
        .removeClass('navbar-fixed-bottom')
        .addClass('col-sm-8 split-screen');
      $('#chat').removeClass('hide');
      $('#chat-icon-container').addClass('hide');
      $('#task-content').addClass('split-screen');
    }

    if ($(window).width() < 992) {
      log("small");
      log($('.offer-choices-label').hasClass('hide'));
      $('.offer-choices-label').addClass('hide');
      $('.offer-choices-label-short').removeClass('hide');
      log($('.offer-choices-label').hasClass('hide'));
    } else {
      log("big");
      log($('.offer-choices-label').hasClass('hide'));
      $('.offer-choices-label').removeClass('hide');
      $('.offer-choices-label-short').addClass('hide');
      log($('.offer-choices-label').hasClass('hide'));
    }
  };

  mod.checkWidth = function() {
    if (!$('#home-page').hasClass('hide'))
      mod.updateHome();

    if (!$('#task-page').hasClass('hide'))
      mod.updateChat();

    if ($(window).width() < 768) {
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
    mod.checkWidth();
    $(window).resize(mod.checkWidth);
  };

  return mod;
}());
