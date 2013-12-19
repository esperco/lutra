function main() {
  display.init();
  page.init();
  svg.init();
  login.initLoginInfo();
  route.setup();
}

$(document).ready(main);
