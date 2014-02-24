var login = function () {
  var mod = {};

  var uid;

  mod.load = function(task) {
    list.iter(task.task_chats, function(chat) {
      if (chat.chat_with) {
        uid = chat.chat_with;
      }
    });
  }

  mod.me = function() {
    return uid;
  }

  return mod;
}();
