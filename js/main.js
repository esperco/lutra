function main() {
  svg.init();
  login.initLoginInfo();
  task.init();
  route.setup();
  display.init();
}

$(document).ready(main);
