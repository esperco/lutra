/*
  Window-level settings
*/

var display = (function() {
  var mod = {};

  mod.updateHome = function() {

    /*** Settings ***/
    if ($(window).width() < 500) {
      $('.linked-account-email').addClass('hide');
      $('.extended-name').addClass('hide');
    } else {
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
      $('.task-row-left').addClass('mobile');
      $('.task-row-right').addClass('mobile');
      $('.archive-desktop').addClass('hide');
      $('.archive-mobile').removeClass('hide');
    } else {
      $('.task-row-left').removeClass('mobile');
      $('.task-row-right').removeClass('mobile');
      $('.archive-desktop').removeClass('hide');
      $('.archive-mobile').addClass('hide');
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
