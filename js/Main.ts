module Main {

  function main() {
    Svg.init();
    Login.initLoginInfo();
    Route.setup();
    Status.init();
    (<any> $("[data-toggle='tooltip']")).tooltip();
  }

  $(document).ready(main);

}
