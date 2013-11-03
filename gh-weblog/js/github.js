/**
 * Tiny github.js shim
 */
(function() {

  var branch = "gh-pages",
      username,
      repo,
      token;

  var request = function(method, target, options, callback) {
    var path = "/repos/"+username+"/"+repo+"/contents/"+target;
    var xhr = new XMLHttpRequest();
    xhr.open(method, "https://api.github.com" + path, true);
    xhr.onreadystatechange  = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 0 || xhr.status === 200) {
          var data = xhr.responseText;
          try {
            data = JSON.parse(data);
            callback(null, data);
          } catch(e) { callback("json parse error"); }
        } else { callback(xhr.status); }
      }
    }
    if(method === "GET") {
      xhr.send(null);
    }
    else {
      options.username     = username;
      options.branch       = branch;
      options.access_token = token;
      xhr.send(options);
    }
  };

  var Repo = function(_username, _repo) {
    username = _username;
    repo = _repo;
  };

  Repo.prototype = {
    read: function(_, target, callback) {
      request("GET", target, {}, callback);
    },
    write: function(_, target, content, message, callback) {},
    update: function(_, target, content, message, callback) {},
    remove: function(_, target, message, callback) {
      request("DELETE", target, { message: message }, callback);
    },
    getLatestCommit: function() {}
  }

  window.Github = function(options) {
    token = options.token;
    this.authenticate();
  };

  window.Github.prototype = {
    authenticate: function() {},
    getRepo: function(username, repo) {
      return new Repo(username, repo);
    }
  };

}());
