function main() {
  api.getTask().done(function(task) {
    login.load(task);
    pusher.start();
    guestTask.loadTask(task);
    chat.loadGuestTaskChats(task);
  });
}

$(document).ready(main);
