var author_control = can.Control.extend({
  init: function() {
    this.element.html(can.view('assets/views/authorView.ejs', {
      user: this.options.user
    }));
  }
});

var author_observable = can.Model.extend({
  findOne: users.get,
  update: users.replace
});
