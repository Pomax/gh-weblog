(function() {

  if(!window["gh-weblog"]) { window["gh-weblog"] = {}; }

  var context = window["gh-weblog"],
      entriesDiv = document.getElementById("entries"),
      github,
      repo,
      cfnGenerator = function() {
        var d = new Date(),
            components = [
              d.getFullYear(),
              d.getMonth(),
              d.getDay(),
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
    console.log("parse entry " + entry.id);
    var content = entry.querySelector(".content"),
        ocontent = entry.querySelector(".original.content");
    content.innerHTML = markdown.toHTML(content.textContent);
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
    console.log("new entry " + uid);

    // set up entry object
    var entryObject = entryObject || {
      title: "",
      author: "",
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
    console.log("edit entry " + uid);
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
    console.log("update entry " + uid);
    if(!uid) return;
    var entry = document.getElementById("gh-weblog-"+uid);
    var content = entry.querySelector(".content");
    var newContent = ocontent.value;
    // record the change to the entry
    var entryObject = context.entries[""+uid];
    entryObject.content = newContent;
    entryObject.updated = Date.now();
    // reswitcharoo
    ocontent.hide();
    content.innerHTML = markdown.toHTML(newContent);
    content.show();
    // send a github "create" commit up to github for this entry's file
    if (entry.classList.contains("pending")) {
      context.saveEntry(uid, function afterSaving(err) {
        entry.classList.remove("pending");
      });
    } else {
      // ... code goes here ...
    }
  };

  /**
   *
   */
  context.saveEntry = function saveEntry(uid, afterSaving) {
    console.log("save entry " + uid);
    if(!uid) return;
    var entryObject = context.entries[""+uid];
    delete entryObject.pending;
    var entryString = JSON.stringify(entryObject);

    // send a github "addition" commit up to github with the new file and an addition to content.js
    var filename = cfnGenerator();
    repo.write('gh-pages', 'content/' + filename, entryString + '\n', 'weblog entry '+filename, function(err) {
      console.error("error while writing entry to github: ", err);
    });

    // also send up an updated js/content.js
    var contentjs = context.content;
    contentjs.push(filename.replace(".json",''));
    var contentString = 'window["gh-weblog"].content = [\n  "' + contentjs.join('",\n  "') + '"\n];\n';
    repo.write('gh-pages', 'js/content.js', JSON.stringify() + '\n', 'content entry for '+filename, function(err) {
      console.error("error while writing entry log to github: ", err);
    });

    // aaaand callback on next tick
    cue(afterSaving);
  };

  /**
   *
   */
  context.removeEntry = function removeEntry(uid) {
    console.log("remove entry " + uid);
    if(!uid) return;
    var entry = document.getElementById("gh-weblog-"+uid);
    var confirmation = confirm("Are you sure you want to remove this entry?");
    if(confirmation) entry.remove();

    // send a github "removal" commit up to github for the old file and removal from content.js
    // ...
  };

  /**
   *
   */
  context.setCredentials = function setCredentials(silent) {
    var creds = localStorage["gh-weblog-token"];
    var newcreds = (silent ? creds : prompt("Please specify your github token" + (creds ? ". Current token: "+creds : '')));
    localStorage["gh-weblog-token"] = newcreds;
    if(newcreds == "") { document.body.classList.add("default"); }
    else {
      document.body.classList.remove("default");
      github = new Github({ token: newcreds });
      repo = github.getRepo("Pomax", "weblog");
      console.log(repo);
    }
  };

}());
