var p = "gh-weblog/js/";
define([p+"nunjucks", p+"marked", p+"octokit", p+"content"], function(Nunjucks, marked, Octokit, content) {
  "use strict";

  var create = function(tag, content) { var _ = document.createElement(tag); if(content) _.innerHTML = content; return _; };
  var show   = function(e) { e.classList.remove("hidden"); }
  var hide   = function(e) { e.classList.add("hidden"); }
  var remove = function(e) { e.parentNode.removeChild(e); }

  /**
   * Calling requestAnimationFrame, even though it does
   * exactly what we want, is weird. So we alias it to "cue".
   */
  var cue = (window.requestAnimationFrame ? function cue(fn) { requestAnimationFrame(fn); } : function cue(fn) { setTimeout(fn, 0); });

  var cfnGenerator = function(uid) {
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

  /**
   * Our weblog object's constructor
   */
  var WebLog = function(options) {
    var weblog = this;
    this.entries = {};
    this.options = options;

    options.newestFirst = options.order ? options.order=="newest" : false;
    this.processors = options.processors || [];
    this.processors = this.processors.map(function(fName) { return window[fName]; }) || [];

    if(!options.username || !options.repo) {
      return console.error("No username and/or repository provided for gh-weblog.");
    }

    // set up the templating environment
    this.nunjucks = new nunjucks.Environment(new nunjucks.WebLoader("gh-weblog/views"));

    this.nunjucks.addFilter("readableDate", function(data) {
      return (new Date(data)).toLocaleString();
    });

    this.nunjucks.addFilter("shortDate", function(data) {
      return (new Date(data)).toLocaleDateString();
    });

    this.nunjucks.render("container.html", {}, function(err, result) {
      if(err) { return console.error("Nunjucks render error", err); }
      weblog.container = document.querySelector("#gh-weblog-container");
      weblog.container.innerHTML = result;
      weblog.entriesDiv = weblog.container.querySelector(".entries");
      weblog.buildPage(content);
    });

  };

  /**
   * Our weblog's identity
   */
  WebLog.prototype = {

    /**
     *
     */
    setCredentials: function setCredentials(silent) {
      var weblog = this;
      var creds = localStorage["gh-weblog-token"];
      var newcreds = (silent ? creds || "undefined": prompt("Please specify your github token" + (creds ? ". Current token: "+creds : '')));
      if (newcreds.trim() === "") { newcreds = "undefined"; }
      localStorage["gh-weblog-token"] = newcreds;
      if (newcreds === "undefined") { weblog.container.classList.add("default"); }
      else {
        weblog.container.classList.remove("default");
        github = new Octokit({ token: newcreds });
        weblog.repo   = github.getRepo(context.username, context.repo);
        weblog.branch = weblog.repo.getBranch(context.branch);
      }
    },

    /**
     *
     */
    loadEntries: function loadEntries(list) {
      if(list.length === 0) { return; }

      var weblog = this,
          resource = list.splice(list.length-1,1)[0],
          xhr = new XMLHttpRequest();

      xhr.open("GET", "gh-weblog/content/" + resource + ".json", true);
      xhr.onreadystatechange  = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 0 || xhr.status === 200) {
            var data = xhr.responseText;
            try {
              data = JSON.parse(data);
              weblog.entries[""+data.published] = data;
              cue(function() {
                weblog.addEntry(data.published, data);
                weblog.loadEntries(list);
              });
            }
            catch (e) { console.error("JSON parse error", e); }
          }
        }
      };

      try { xhr.send(null); }
      catch (e) { console.error("XHR error for "+resource+".json", e); }
    },

    /**
     *
     */
    buildPage: function buildPage(content) {
      // make sure we order the entries correctly
      var list = content.slice();
      if(!this.options.newestFirst) {
        list = list.reverse();
      }
      this.loadEntries(list);
      this.setCredentials(true);
    },

    /**
     * Add an entry to the log. This can be an new, empty, entry,
     * or it can be an entry that was loaded from a list of knowns.
     */
    addEntry: function addEntry(uid, entryObject) {
      var weblog = this;
      var newEntry = (arguments.length === 0);
      uid = uid || Date.now();

      // set up entry object
      var entryObject = entryObject || {
        title: "",
        author: this.username,
        content: "#New Entry\nclick the entry to start typing",
        tags: ['no tags yet'],
        published: uid,
        updated: uid,
        pending: true
      };
      this.entries[""+uid] = entryObject;

      // add to page
      try {
        this.nunjucks.render("entry.html", entryObject, function(err, result) {
          if(err) { return console.error("Nunjucks render error", err); }
          var element = create("div", result).children[0];

          // new entry, or laoded-from-known-list?
          if (newEntry) { weblog.entriesDiv.prependChild(element); }
          else { weblog.entriesDiv.appendChild(element); }

          // perform content interpretation
          weblog.parseEntry(element);

          // Make sure that we scrollTo if the entry was loaded
          // and there is a URL #fragment identifier.
          var l = window.location.toString(),
              pos = l.lastIndexOf("#");
          if(pos > -1) {
            var fragment = l.substring(pos);
            if (fragment.length > 2) {
              window.location = fragment;
            }
          }

          // Set up the entry's tag editing, too
          var tagsdiv = element.querySelector(".tags")
          tagsdiv.addEventListener("click", function(evt) {
            var input = prompt("Specify tags (comma separated):", entryObject.tags.join(", "));
            if(!input) return;
            entryObject.tags = input.split(",").map(function(v) { return v.trim(); });
            this.updateEntry(uid);
            tagsdiv.innerHTML = entryObject.tags.join(",");
          });

        });
      } catch (e) { return console.error("Nunjucks error", e); }
    },

    /**
     * parse/rewrite an entry's content
     */
    parseEntry: function parseEntry(entry) {
      var element = entry.querySelector(".content"),
          original = entry.querySelector(".original.content");
      // markdown rewrite
      element.innerHTML = marked(original.textContent);
      // processor actions
      this.processors.forEach(function(process) {
        process(element);
      });
    },


    /**
     * Edit an entry
     */
    editEntry: function editEntry(uid) {
      if(!uid || !this.container.contains("default")) return;
      var entry = document.getElementById("gh-weblog-"+uid),
          content = entry.querySelector(".content"),
          ocontent = entry.querySelector(".hidden.original.content");
      hide(content);
      show(ocontent);
      ocontent.focus();
    },

    /**
     * Update an entry after it has been edited
     */
    updateEntry: function updateEntry(uid, ocontent) {
      if(!uid) return;
      var entryObject = this.entries[""+uid];
      var entry = document.getElementById("gh-weblog-"+uid);

      // content changed?
      if (ocontent) {
        var content = entry.querySelector(".content");
        var newContent = ocontent.value;
        // record the change to the entry
        var updated = false;
        if (entryObject.content.trim() != newContent.trim()) {
          entryObject.content = newContent;
          entryObject.updated = Date.now();
          updated = true;
        }
        // reswitcharoo
        hide(ocontent);
        content.innerHTML = marked(newContent);
        context.processors.forEach(function(fn) { fn(content); });
        show(content);
        // break early if we don't need to notify github of changes
        if(!updated) return;
      }

      // send a github "create" commit to github for this entry's file
      // if this was a newly made entry with a first-time update.
      if (entry.classList.contains("pending")) {
        context.saveEntry(uid, function afterSaving(err) {
          entry.classList.remove("pending");
        });
      }

      // send a github "update" commit to github for this entry's file
      // if this was a normally loaded entry that got edited.
      else {
        var entryString = JSON.stringify(entryObject);
        var filename = cfnGenerator(uid);
        var path = context.path + 'content/' + filename;
        branch.write(path, entryString, 'update for entry '+filename);
      }
    },

    /**
     *
     */
    saveEntry: function saveEntry(uid, afterSaving) {
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
              }, cacheDelay);
            });
    },

    /**
     *
     */
    formRSS: function formRSS(entries) {
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
          , '<title>' + (function() {
               return e.content.split("\n")[0].replace(/#/g,'');
            }())+ '</title>'
          , (function(tags) {
            var s = [];
            tags.forEach(function(tag) {
              s.push('<category>' + tag + '</category>');
            });
            return s.join("\n");
          }(e.tags))
          , '<link>' + window.location.toString() + '#gh-weblog-' + e.published + '</link>'
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
    },

    /**
     *
     */
    saveContentJS: function saveContentJS(filename, removeFile, uid) {
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
    },

    /**
     *
     */
    removeEntry: function removeEntry(uid) {
      //console.log("remove entry " + uid);
      if(!uid) return;
      var entry = document.getElementById("gh-weblog-"+uid);
      var confirmation = confirm("Are you sure you want to remove this entry?");
      if(confirmation) remove(entry);

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
    },

    // end of prototype
    noop: function() {}
  };

  return WebLog;
});
