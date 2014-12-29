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
    xhr.open("GET", url, true);
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
      handleIndex(err, result ? result.index : false);
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

    var index = JSON.stringify({index:index},false,2);
    var indexFilename = this.options.path + "/content/index.json";
    //console.log(indexFilename, index);
    var metadata = JSON.stringify(entry.getMetaData(), false, 2);
    var metadataFilename = this.options.path + "/content/posts/metadata/" + id + ".json";
    //console.log(metadataFilename, ":", metadata)
    var postdata = entry.getPostData();
    var postdataFilename = this.options.path + "/content/posts/markdown/" + id + ".md";
    //console.log(postdataFilename + ":", postdata);

    var contents = {};
    content[indexFilename] = index;
    content[metadataFilename] = metadata;
    content[postdataFilename] = postdata;

    this.branch.writeMany(contents, "Saving new entry " + id + " remotely").then(function() {
      console.log("finished saving files");
      if(saved) saved();
    });
  },

  updateEntry: function(entry) {
    console.log("updating entry "+entry.state.created);
    // ... code goes here ...
  },

  deleteEntry: function(entry, index) {
    var id = entry.state.id;
    console.log("Deleting " + id + " remotely");
    console.log(this.options.path + "/content/posts/metadata/" + id + ".json")
    console.log(this.options.path + "/content/posts/markdown/" + id + ".md");
    var index = JSON.stringify({index:index},false,2);
    console.log(this.options.path + "/content/index.json", index);
  }

};

var connector = new Connector({
  token: localStorage["gh-weblog-token"],
  user: "Pomax",
  repo: "gh-blog",
  branch: "react",
  path: "gh-weblog"
});
