function main() {
  page.init();
  svg.init();
  login.initLoginInfo();
  route.setup();
}

$(document).ready(function() {

  $('[data-toggle="tooltip"]').tooltip({'placement': 'left'});

  var $window = $(window);

  function checkWidth() {
    if ($window.width() < 992) {
      $('#task-navbar').removeClass('col-md-8 split-screen').addClass('navbar-fixed-top');
      $('.new-task-footer').removeClass('col-md-8 split-screen').addClass('navbar-fixed-bottom');
      $('.sched-footer').removeClass('col-md-8 split-screen').addClass('navbar-fixed-bottom');
      $('#chat').addClass('hide');
      $('#task-content').removeClass('split-screen');
    };

    if ($window.width() >= 992) {
      $('#task-navbar').removeClass('navbar-fixed-top').addClass('col-md-8 split-screen');
      $('.new-task-footer').removeClass('navbar-fixed-bottom').addClass('col-md-8 split-screen');
      $('.sched-footer').removeClass('navbar-fixed-bottom').addClass('col-md-8 split-screen');
      $('#chat').removeClass('hide');
      $('#task-content').addClass('split-screen');
    }
  }

  checkWidth();
  $(window).resize(checkWidth);

});

$(document).ready(main);