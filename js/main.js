function main() {
  svg.init();
  login.initLoginInfo();
  route.setup();
  status_.init();
  $("[data-toggle='tooltip']").tooltip();
}

$(document).ready(main);
