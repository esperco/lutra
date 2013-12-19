/*
  Window-level settings
*/

var display = (function() {
  var mod = {};

  function checkWidth() {
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
    }
    else {
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
  }

  mod.init = function() {
    checkWidth();
    $(window).resize(checkWidth);
  };

  return mod;
}());
