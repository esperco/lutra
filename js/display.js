/*
  Window-level settings
*/

var display = (function() {
  var mod = {};

  mod.updateHome = function() {
    if ($(window).width() < 768) {
      $('#desktop-navbar').addClass('hide');
      $('#mobile-navbar').removeClass('hide');
      $('.home-container').removeClass('navbar-open');
      $('#home-push').removeClass('hide');
      $('.page-title').addClass('hide');
      $('.new-task-btn').addClass('hide');
    } else {
      $('#desktop-navbar').removeClass('hide');
      $('#mobile-navbar').addClass('hide');
      $('.home-container').addClass('navbar-open');
      $('#home-push').addClass('hide');
      $('.page-title').removeClass('hide');
      $('.new-task-btn').removeClass('hide');
    }
  };

  mod.checkWidth = function() {
    if ($(window).width() < 768) {
      $('#login-container')
        .removeClass('desktop-login')
        .addClass('mobile-login');
    } else {
      $('#login-container')
        .removeClass('mobile-login')
        .addClass('desktop-login');
    }

    if (!$('#home-page').hasClass('hide'))
      mod.updateHome();

    if ($(window).width() < 992) {
      $('#task-navbar')
        .removeClass('col-md-8 split-screen')
        .addClass('navbar-fixed-top');
      $('.new-task-footer')
        .removeClass('col-md-8 split-screen')
        .addClass('navbar-fixed-bottom');
      $('.sched-footer')
        .removeClass('col-md-8 split-screen')
        .addClass('navbar-fixed-bottom');
      $('#chat').addClass('hide');
      $('#task-content').removeClass('split-screen');
    } else {
      $('#task-navbar')
        .removeClass('navbar-fixed-top')
        .addClass('col-md-8 split-screen');
      $('.new-task-footer')
        .removeClass('navbar-fixed-bottom')
        .addClass('col-md-8 split-screen');
      $('.sched-footer')
        .removeClass('navbar-fixed-bottom')
        .addClass('col-md-8 split-screen');
      $('#chat').removeClass('hide');
      $('#task-content').addClass('split-screen');
    }
  };

  mod.init = function() {
    mod.checkWidth();
    $(window).resize(mod.checkWidth);
  };

  return mod;
}());
