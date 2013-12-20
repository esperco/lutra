function main() {
  display.init();
  page.init();
  svg.init();
  login.initLoginInfo();
  task.init();
  route.setup();
}

$(document).ready(main);
