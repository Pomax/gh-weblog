var WebLog = React.createClass({

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
    connector.loadIndex(this.loadIndex);
  },

  render: function() {
    var self = this;

    var entries = this.getSlice().map(function(entry) {
      return <Entry key={entry.metadata.created}
                    metadata={entry.metadata}
                    postdata={entry.postdata}
                    onSave={self.save}
                    onDelete={self.delete}/>;
    });

    return (
      <div ref="weblog" className="gh-weblog">
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
    var addEntry = this.addEntry;
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
          addEntry(id, metadata, postdata);
          next(list);
        });
      });
    }(slice));
  },

  addEntry: function(id, metadata, postdata) {
    metadata.id = id;
    this.index.push(id);
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
    this.addEntry(id, metadata, postdata);
  },

  save: function(entry) {
    connector.saveEntry(entry, this.index);
  },

  delete: function(entry) {
    var confirmed = confirm("really delete post?");
    if(confirmed) {
      var id = entry.state.id;
      // remove from index:
      var pos = this.index.indexOf(id);
      this.index.splice(pos,1);
      // remove from list of loaded entries:
      delete this.list[id];
      this.setState({ entries: this.list });
      // delete entry remotely
      connector.deleteEntry(entry, this.index);
    }
  },

  toRSS: function() {
    // code goes here
  }

});

