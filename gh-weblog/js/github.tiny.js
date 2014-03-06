/**
 * Tiny github.js shim
 */
(function() {

  var branch = "gh-pages",
      username,
      repo,
      token;

  var request = function(method, target, options, callback) {
    var path = "/repos/"+username+"/"+repo+"/contents/"+target + "?access_token=" + token;
    var xhr = new XMLHttpRequest();
    xhr.open(method, "https://api.github.com" + path, true);
    xhr.onreadystatechange  = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 0 || xhr.status === 200 || (xhr.status === 201 && method === "PUT")) {
          var data = xhr.responseText;
          try {
            data = JSON.parse(data);
            callback(undefined, data);
          } catch(e) {
            callback("json parse error on "+data);
          }
        } else { callback(xhr.status); }
      }
    }
    if(method === "GET") {
      xhr.send(null);
    }
    else {
      options.username     = username;
      options.branch       = branch;
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(options));
    }
  };

  var Repo = function(_username, _repo) {
    username = _username;
    repo = _repo;
  };

  function prepForCommit(content) {
    if (content.lastIndexOf("\n") !== content.length-1) {
      content += "\n";
    }
    return btoa(content);
  }

  Repo.prototype = {
    read: function(_, target, callback) {
      request("GET", target, {
        ref: branch
      }, callback);
    },
    write: function(_, target, content, message, callback) {
      content = prepForCommit(content);
      request("PUT", target, {
        content: content,
        message: message
      }, callback);
    },
    update: function(_, target, content, message, callback) {
      this.read(_, target, function(err, fileInfo) {
        content = prepForCommit(content);
        request("PUT", target, {
          content: content,
          message: message,
          sha: fileInfo.sha
        }, callback);
      });
    },
    remove: function(_, target, message, callback) {
      this.read(_, target, function(err, fileInfo) {
        request("DELETE", target, {
          message: message,
          sha: fileInfo.sha
        }, callback);
      });
    },
    getLatestCommit: function() {}
  }

  window.Github = function(username, password) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://api.github.com/user", false);

    xhr.setRequestHeader('Accept','application/vnd.github.raw+json');
    xhr.setRequestHeader('Content-Type','application/json;charset=UTF-8');

    xhr.send(JSON.stringify({
      username: username,
      password: password || "x-oauth-basic"
    }));

    console.log(xhr.responseText);
  };

  window.Github.prototype = {
    getRepo: function(username, repo) {
      return new Repo(username, repo);
    }
  };

}());
