function setupPostHandling() {
  var context = window["gh-weblog"],
      entriesDiv = document.querySelector("#gh-weblog-container .entries"),
      github,
      repo,
      branch,
      cfnGenerator = function(uid) {
        var d = new Date(uid ? uid : Date.now()),
            components = [
              d.getFullYear(),
              d.getMonth() + 1,
              d.getDate(),
              d.getHours(),
              d.getMinutes(),
              d.getSeconds()
            ];
        components = components.map(function(v) {
          return (v < 10 ? "0" + v : v);
        });
        return components.join("-") + ".json";
      };

  entriesDiv.prependChild = function(element) {
    if(entriesDiv.children.length === 0) {
      entriesDiv.appendChild(element);
    } else {
      entriesDiv.insertBefore(element, entriesDiv.children[0]);
    }
  }

  /**
   *
   */
  context.parseEntry = function parseEntry(entry) {
//  console.log("parse entry " + entry.id);
    var content = entry.querySelector(".content"),
        ocontent = entry.querySelector(".original.content");
    content.innerHTML = marked(content.textContent);
    [content, ocontent].forEach(function(e) {
      e.show = function() { e.classList.remove("hidden"); }
      e.hide = function() { e.classList.add("hidden"); }
      e.remove = function() { e.paarentNode.removeChild(e); }
    });
  };

  /**
   *
   */
  context.addEntry = function newEntry(uid, entryObject) {
    uid = uid || Date.now();
//  console.log("new entry " + uid);

    // set up entry object
    var entryObject = entryObject || {
      title: "",
      author: context.username,
      content: "#New Entry\nclick the entry to start typing",
      published: uid,
      updated: uid,
      pending: true
    };
    context.entries[""+uid] = entryObject;

    // add to page
    try {
      nunjucksEnv.render("entry.html", entryObject, function(err, result) {
        if(err) { return console.error("Nunjucks render error", err); }
        var _ = document.createElement("div");
        _.innerHTML = result;
        var element = _.children[0];
        entriesDiv.prependChild(element);
        context.parseEntry(element);
      });
    } catch (e) { return console.error("Nunjucks error", e); }
  };

  /**
   *
   */
  context.editEntry = function editEntry(uid) {
//  console.log("edit entry " + uid);
    if(!uid) return;
    var entry = document.getElementById("gh-weblog-"+uid),
        content = entry.querySelector(".content"),
        ocontent = entry.querySelector(".hidden.original.content");
    // switcharoo
    if(!document.body.classList.contains("default")) {
      content.hide();
      ocontent.show();
      ocontent.focus();
    }
  };

  /**
   *
   */
  context.updateEntry = function updateEntry(uid, ocontent) {
//  console.log("update entry " + uid);
    if(!uid) return;
    var entry = document.getElementById("gh-weblog-"+uid);
    var content = entry.querySelector(".content");
    var newContent = ocontent.value;
    // record the change to the entry
    var entryObject = context.entries[""+uid];
    var updated = false;
    if (entryObject.content.trim() != newContent.trim()) {
      entryObject.content = newContent;
      entryObject.updated = Date.now();
      updated = true;
    }
    // reswitcharoo
    ocontent.hide();
    content.innerHTML = marked(newContent);
    content.show();
    if(!updated) return;
    // send a github "create" commit to github for this entry's file
    if (entry.classList.contains("pending")) {
//    console.log("NEW ENTRY - SAVING RATHER THAN UPDATING");
      context.saveEntry(uid, function afterSaving(err) {
        entry.classList.remove("pending");
      });
    }
    // send a github "update" commit to github for this entry's file
    else {
      var entryObject = context.entries[""+uid];
      var entryString = JSON.stringify(entryObject);
      var filename = cfnGenerator(uid);
      var path = context.path + '/content/' + filename;
      console.log(path);
      branch.write(path, entryString, 'new content for entry '+filename);
    }
  };

  /**
   *
   */
  context.saveEntry = function saveEntry(uid, afterSaving) {
//  console.log("save entry " + uid);
    if(!uid) return;
    var entryObject = context.entries[""+uid];
    delete entryObject.pending;
    var entryString = JSON.stringify(entryObject);
    var errors = false;

    // send a github "addition" commit up to github with the new file and an addition to content.js
    var filename = cfnGenerator(uid);
    var path = context.path + '/content/' + filename;
    branch.write(path, entryString + '\n', 'weblog entry '+filename)
          .done(function() {
            console.log("post save hook");
            context.saveContentJS(filename);
            cue(afterSaving);
          });
  };

  /**
   *
   */
  context.saveContentJS = function saveContentJS(filename, removeFile) {
    var shortString = filename.replace(".json",'');
    if(removeFile) {
      var pos = context.content.indexOf(shortString);
      if (pos > -1) { context.content.splice(pos, 1); }
    }
    else { context.content.push(shortString); }
    var contentString = 'window["gh-weblog"].content = [\n  "' + context.content.join('",\n  "') + '"\n];\n';
    var path = context.path + '/js/content.js';
    branch.write(path, contentString, 'content entry for '+filename);
  };

  /**
   *
   */
  context.removeEntry = function removeEntry(uid) {
//  console.log("remove entry " + uid);
    if(!uid) return;
    var entry = document.getElementById("gh-weblog-"+uid);
    var confirmation = confirm("Are you sure you want to remove this entry?");
    if(confirmation) entry.remove();

    // send a github "removal" commit up to github for the old file and removal from content.js
    var filename = cfnGenerator(uid);
    branch.remove(context.path + '/content/' + filename, "removing entry " + filename)
          .done(function() {
            var removeFile = true;
            context.saveContentJS(filename, removeFile);
          });
  };

  /**
   *
   */
  context.setCredentials = function setCredentials(silent) {
    var creds = localStorage["gh-weblog-token"];
    var newcreds = (silent ? creds || "undefined": prompt("Please specify your github token" + (creds ? ". Current token: "+creds : '')));
    if(newcreds.trim()=="") { newcreds = "undefined"; }
    localStorage["gh-weblog-token"] = newcreds;
    if(newcreds == "undefined") { document.body.classList.add("default"); }
    else {
      document.body.classList.remove("default");
      github = new Octokit({
        username: context.username,
        password: newcreds
      });
      window.repo = repo = github.getRepo(context.username, context.repo);
      window.branch = branch = repo.getBranch(context.branch);
    }
  };
}
