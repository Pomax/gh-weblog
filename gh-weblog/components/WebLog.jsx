var WebLog = React.createClass({

  mixins: [ConnectorMixin],

  // local cache, because we don't want to load the entire
  // index at once, and we don't want to requery for it.
  index: [],

  // local cache, because we can't be sure state won't
  // be modified multiple times per time slice.
  list: {},

  getInitialState: function() {
    return {
      entries: this.list,
      slice: { start: 0, end: 10 }
    };
  },

  componentDidMount: function() {
    this.connector = new this.Connector({
      token: localStorage["gh-weblog-token"],
      user: this.props.user,
      repo: this.props.repo,
      branch: this.props.branch,
      path: this.props.path
    });
    this.connector.loadIndex(this.loadIndex);
  },

  render: function() {
    var self = this;

    var entries = this.getSlice().map(function(entry) {
      return <Entry key={entry.metadata.created}
                    ref={entry.metadata.id}
                    metadata={entry.metadata}
                    postdata={entry.postdata}
                    onSave={self.save}
                    onDelete={self.delete}/>;
    });

    return (
      <div ref="weblog" className="gh-weblog">
        <button onClick={this.toRSS}>RSS</button>
        <button onClick={this.create}>new entry</button>
        {entries}
      </div>
    );
  },

  getSlice: function() {
    var list = this.list;
    var start = this.state.slice.start;
    var end = this.state.slice.end;
    var ids = Object.keys(list).sort().reverse().slice(start, end);
    return ids.map(function(id) { return list[id]; });
  },

  loadIndex: function(err, index) {
    // latest entry on top
    this.index = index.reverse();
    this.loadEntries();
  },

  loadEntries: function() {
    var connector = this.connector;
    var setEntry = this.setEntry;
    // find load slice
    var start = this.state.slice.start;
    var end = this.state.slice.end;
    var slice = this.index.slice(start, end);
    var cache = this.list;
    // run through all
    (function next(list) {
      if(list.length===0) return;
      var id = list.splice(0,1)[0];
      if(cache[id]) return next(list);
      connector.loadMetadata(id, function(err, metadata) {
        connector.loadEntry(id, function(err, postdata) {
          setEntry(id, metadata, postdata);
          next(list);
        });
      });
    }(slice));
  },

  setEntry: function(id, metadata, postdata) {
    metadata.id = id;
    if(this.index.indexOf(id)===-1) {
      this.index.push(id);
    }
    this.list[id] = {
      metadata: metadata,
      postdata: postdata
    };
    this.setState({ entries: this.list });
  },

  create: function() {
    var date = new Date();
    var timestamp = date.getTime();
    var metadata = {
      title: "New Entry",
      created: timestamp,
      published: timestamp, // we can turn this into -1 for drafts
      updated: timestamp,
      tags: []
    };
    var postdata = "...";
    var id = date.toISOString().replace('T','-').replace(/\..*/,'').replace(/\:/g,'-');
    this.setEntry(id, metadata, postdata);
  },

  save: function(entry) {
    var self = this;
    var connector = this.connector;
    this.setEntry(entry.state.id, entry.getMetaData(), entry.postdata);
    connector.saveEntry(entry, this.index, function saved() {
      console.log("save handled - updating RSS");
      connector.saveRSS(self.toRSS());
    });
  },

  delete: function(entry) {
    var confirmed = confirm("really delete post?");
    if(confirmed) {
      var self = this;
      var connector = this.connector;
      var id = entry.state.id;
      // remove from index:
      var pos = this.index.indexOf(id);
      this.index.splice(pos,1);
      // remove from list of loaded entries:
      delete this.list[id];
      this.setState({ entries: this.list });
      // delete entry remotely
      connector.deleteEntry(entry, this.index, function deleted() {
        console.log("delete handled - updating RSS");
        connector.saveRSS(self.toRSS());
      });
    }
  },

  /**
   * So, this is weird given that
   */
  toRSS: function() {
    var self = this;
    var base = this.props.base;

    var rssHeading = [
        '<?xml version="1.0" encoding="UTF-8" ?>'
      , '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">'
      , '<channel>'
      , '<atom:link href="' + this.props.base + '/' + this.props.path + '/rss.xml" rel="self" type="application/rss+xml" />'
      , '<title>' + this.props.title + '</title>'
      , '<description>' + this.props.description + '</description>'
      , '<link>' +  base + '</link>'
      , '<lastBuildDate>' + (new Date()).toUTCString() + '</lastBuildDate>'
      , '<pubDate>' + (new Date()).toUTCString() + '</pubDate>'
      , '<ttl>1440</ttl>'
    ].join("\n") + "\n";

    // only RSS-o-late the last 10 entries
    var entryIds = Object.keys(this.list).sort().reverse().slice(0,10);
    console.log(entryIds);

    return;

    var entriesRSS = entryIds.map(function(id) {
      console.log(id);
      var entry = self.refs[id];
      var rssForm = [
          '<item>'
        , '<title>' + entry.state.title + '</title>'
        , '<description>' + entry.getHTMLData() + '</description>'
        , entry.state.tags.map(function(tag) { return '<category>' + tag + '</category>'; }).join("\n")
        , '<link>' + base + '/#gh-weblog-' + entry.state.published + '</link>'
        , '<guid>' + base + '/#gh-weblog-' + entry.state.published + '</guid>'
        , '<pubDate>' + (new Date(entry.state.published)).toUTCString() + '</pubDate>'
        , '</item>'
      ];
      return rssForm.join('\n');
    }).join('\n');

    var rssTail = [
        '</channel>'
      , '</rss>'
    ].join("\n") + "\n";

    var rss = rssHeading + entriesRSS + rssTail;
    console.log(rss);
  }

});

