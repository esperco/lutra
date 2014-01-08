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

  mod.updateTask = function() {
    if ($(window).width() < 1040) {
      $('#task-navbar')
        .addClass('chat-closed')
        .removeClass('chat-open');
      $('.new-task-footer')
        .addClass('chat-closed')
        .removeClass('chat-open');
      $('.sched-footer')
        .addClass('chat-closed')
        .removeClass('chat-open');
      $('#chat').addClass('hide');
      $('#chat-icon-container').removeClass('hide');
      $('#task-content').removeClass('split-screen');
    } else {
      $('#task-navbar')
        .addClass('chat-open')
        .removeClass('chat-closed');
      $('.new-task-footer')
        .addClass('chat-open')
        .removeClass('chat-closed');
      $('.sched-footer')
        .addClass('chat-open')
        .removeClass('chat-closed');
      $('#chat').removeClass('hide');
      $('#chat-icon-container').addClass('hide');
      $('#task-content').addClass('split-screen');
    }

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
    mod.checkWidth();
    $(window).resize(mod.checkWidth);
  };

  return mod;
}());
