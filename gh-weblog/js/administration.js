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
    //console.log("parse entry " + entry.id);
    var content = entry.querySelector(".content"),
        ocontent = entry.querySelector(".original.content");
    content.innerHTML = marked(ocontent.textContent);
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
    //console.log("new entry " + uid);

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
    //console.log("edit entry " + uid);
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
    //console.log("update entry " + uid);
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
      //console.log("NEW ENTRY - SAVING RATHER THAN UPDATING");
      context.saveEntry(uid, function afterSaving(err) {
        entry.classList.remove("pending");
      });
    }
    // send a github "update" commit to github for this entry's file
    else {
      var entryObject = context.entries[""+uid];
      var entryString = JSON.stringify(entryObject);
      var filename = cfnGenerator(uid);
      var path = context.path + 'content/' + filename;
      //console.log("updateEntry", path);
      branch.write(path, entryString, 'new content for entry '+filename);
    }
  };

  /**
   *
   */
  context.saveEntry = function saveEntry(uid, afterSaving) {
    //console.log("save entry " + uid);
    if(!uid) return;
    var entryObject = context.entries[""+uid];
    delete entryObject.pending;
    var entryString = JSON.stringify(entryObject);
    var errors = false;

    // send a github "addition" commit up to github with the new file and an addition to content.js
    var filename = cfnGenerator(uid);
    var path = context.path + 'content/' + filename;
    //console.log("saveEntry", path);
    branch.write(path, entryString + '\n', 'weblog entry '+filename)
          .then(function() {
            //console.log("post save hook");
            setTimeout(function(){
              context.saveContentJS(filename);
              cue(afterSaving);
            }, 2000);
          });
  };

  function formRSS(entries) {
    var head = [
        '<?xml version="1.0" encoding="UTF-8" ?>'
      , '<rss version="2.0">'
      , '<channel>'
      , '<title>Pomax.github.io</title>'
      , '<description>' + document.querySelector("title").innerHTML + '</description>'
      , '<link>' +  window.location.toString() + '</link>'
      , '<lastBuildDate>' + (new Date()).toString() + '</lastBuildDate>'
      , '<pubDate>' + (new Date()).toString() + '</pubDate>'
      , '<ttl>1440</ttl>'
    ].join("\n") + "\n";

    var content = '';
    Object.keys(entries).reverse().slice(0,20).forEach(function(key) {
      var e = entries[key];
      if (!e) return;
      var entryString = [
          '<item>'
        , '<title>' + e.title + '</title>'
        , '<description>' + (function() {
             return e.content.split("\n")[0];
          }())+ '</description>'
        , '<link>' + window.location.toString() + '/#gh-weblog-' + e.published + '</link>'
        , '<guid>' + e.published + '</guid>'
        , '<pubDate>' + (new Date(e.published)).toString() + '</pubDate>'
        , '</item>'
      ];
      content += entryString.join("\n");
    });
    content += "\n";

    var tail = [
        '</channel>'
      , '</rss>'
    ].join("\n") + "\n";

    return head + content + tail;
  }

  /**
   * Save the update to the content.js file, and regenerate the RSS
   */
  context.saveContentJS = function saveContentJS(filename, removeFile, uid) {
    var shortString = filename.replace(".json",'');
    if(removeFile) {
      var pos = context.content.indexOf(shortString);
      if (pos > -1) { context.content.splice(pos, 1); }
    }
    else { context.content.push(shortString); }

    var path = context.path + 'js/content.js';
    var contentString = 'window["gh-weblog"].content = [\n  "' + context.content.join('",\n  "') + '"\n];\n';

    branch.write(path, contentString, 'content entry update (' + (removeFile ? 'entry deleted' : 'new entry') + ') for ' + filename)
          .then(function() {
            setTimeout(function() {
              if(removeFile) {
                context.entries[""+uid] = false;
              }
              var rssPath = context.path + 'rss.xml';
              var rssContentString = formRSS(context.entries);
              branch.write(rssPath, rssContentString, 'content entry RSS update (' + (removeFile ? 'entry deleted' : 'new entry') + ') for ' + filename);
            }, 2000);
          });
  };

  /**
   *
   */
  context.removeEntry = function removeEntry(uid) {
    //console.log("remove entry " + uid);
    if(!uid) return;
    var entry = document.getElementById("gh-weblog-"+uid);
    var confirmation = confirm("Are you sure you want to remove this entry?");
    if(confirmation) entry.remove();

    // send a github "removal" commit up to github for the old file and removal from content.js
    var filename = cfnGenerator(uid);
    var path = context.path + 'content/' + filename;
    //console.log("removeEntry", path);
    branch.remove(path, "removing entry " + filename)
          .then(function() {
            //console.log("post remove hook");
            setTimeout(function() {
              var removeFile = true;
              context.saveContentJS(filename, removeFile, uid);
            }, 2000);
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
      github = new Octokit({ token: newcreds });
      window.repo = repo = github.getRepo(context.username, context.repo);
      window.branch = branch = repo.getBranch(context.branch);
    }
  };
}
