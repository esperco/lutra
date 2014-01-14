function main() {
  svg.init();
  login.initLoginInfo();
  task.init();
  route.setup();
  display.init();
  status.init();
  $("[data-toggle='tooltip']").tooltip();
}

$(document).ready(main);
