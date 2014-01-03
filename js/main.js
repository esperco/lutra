function main() {
  display.init();
  svg.init();
  login.initLoginInfo();
  task.init();
  route.setup();
}

$(document).ready(main);
