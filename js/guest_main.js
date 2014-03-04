function main() {
  api.getTask().done(function(task) {
    login.load(task.guest_task);
    pusher.start();
    guestTask.loadTask(task);
    chat.loadTaskChats(task.guest_task);
  });
}

$(document).ready(main);
