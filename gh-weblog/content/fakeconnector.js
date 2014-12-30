var Connector = function(options) {
  this.options = options;
  var octokit = new Octokit({ token: options.token });
  this.repo = octokit.getRepo(options.user, options.repo);
  this.branch = this.repo.getBranch(options.branch);
};

Connector.prototype = {

  // We don't need zepto or jquery for an xhr .get()
  get: function(url, options, processData) {
    if(options && !processData) {
      processData = options;
      options = {};
    }
    var xhr = new XMLHttpRequest();
    var cachebuster = "?cb="+Date.now();
    xhr.open("GET", url + cachebuster, true);
    Object.keys(options).forEach(function(key) { xhr[key] = options[key]; });
    xhr.onload = function(evt) {
      var obj = evt.target.response;
      processData(!obj, obj);
    };
    xhr.send(null);
  },

  // And we also don't need zepto or jquery for an xhr .json()
  json: function(url, processData) {
    this.get(url, { responseType: "json" }, processData);
  },

  loadIndex: function(handleIndex) {
    this.json("content/posts/index.json", function(err, result) {
      handleIndex(err, result ? result.index.sort() : false);
    });
  },

  loadMetadata: function(id, handleMetadata) {
    this.json("content/posts/metadata/"+id+".json", function(err, result) {
      handleMetadata(err, result);
    });
  },

  loadEntry: function(id, handleEntry) {
    this.get("content/posts/markdown/"+id+".md", function(err, result) {
      handleEntry(err, result);
    });
  },

  saveIndex: function(index) {
    index.sort();
    console.log("saving index");
  },

  saveEntry: function(entry, index, saved) {
    var id = entry.state.id;
    console.log("Saving " + id);
    var path = this.options.path + "/content/posts/",
        index = JSON.stringify({index:index.sort()},false,2),
        indexFilename = path + "index.json",
        metadata = JSON.stringify(entry.getMetaData(), false, 2),
        metadataFilename = path + "metadata/" + id + ".json",
        postdata = entry.getPostData(),
        postdataFilename = path + "markdown/" + id + ".md",
        commitMessage = "Saving new entry " + id,
        content = {};
    content[indexFilename] = index;
    content[metadataFilename] = metadata;
    content[postdataFilename] = postdata;
    try {
      this.branch.writeMany(content, commitMessage).then(function() {
        console.log("Saved entry " + id + " to github.");
        if(saved) saved(entry);
      });
    } catch(e) {
      console.error("saving went horribly wrong");
      throw e;
    }
  },

  updateEntry: function(entry, updated) {
    var id = entry.state.id;
    console.log("Updating " + id);
    var path = this.options.path + "/content/posts/",
        metadata = JSON.stringify(entry.getMetaData(), false, 2),
        metadataFilename = path + "metadata/" + id + ".json",
        postdata = entry.getPostData(),
        postdataFilename = path + "markdown/" + id + ".md",
        commitMessage = "Updating entry " + id,
        content = {};
    content[metadataFilename] = metadata;
    content[postdataFilename] = postdata;
    try {
      this.branch.writeMany(content, commitMessage).then(function() {
        console.log("Updated entry " + id + " on github.");
        if(updated) updated(entry);
      });
    } catch(e) {
      console.error("updating went horribly wrong");
      throw e;
    }
  },

  deleteEntry: function(entry, index, deleted) {
    var id = entry.state.id;
    console.log("Deleting " + id);

    var path = this.options.path + "/content/posts/";
    var indexFilename = path + "index.json";
    var index = JSON.stringify({index:index.sort()},false,2);
    var metadataFilename = path + "metadata/" + id + ".json";
    var postdataFilename = path + "markdown/" + id + ".md";
    var commitMessage = "Removing entry " + id;
    var branch = this.branch;

    try {
      // update index
      branch.write(indexFilename, index, commitMessage)
      // then remove posts
      .then(function() {
        return branch.remove(metadataFilename, commitMessage);
      })
      .then(function() {
        return branch.remove(postdataFilename, commitMessage);
      })
      .then(function() {
        console.log("Removed entry " + id + " from github.");
        if(deleted) deleted(entry);
      });
    } catch(e) {
      console.error("deleting went horribly wrong");
      throw e;
    }
  }

};

var connector = new Connector({
  token: localStorage["gh-weblog-token"],
  user: "Pomax",
  repo: "gh-blog",
  branch: "react",
  path: "gh-weblog"
});
