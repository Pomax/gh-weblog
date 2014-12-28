var WebLog = React.createClass({

  // local cache, because we can't be sure state won't
  // be modified multiple times per time slice.
  list: [],

  getInitialState: function() {
    return { entries: this.list };
  },

  componentDidMount: function() {
    connector.loadIndex(this.loadIndex);
  },

  render: function() {
    var self = this;
    var entries = this.state.entries.map(function(entry){
      return <Entry meta={entry.meta} text={entry.text} key={entry.meta.published} onDelete={self.delete}/>;
    });
    return (
      <div ref="weblog" className="gh-weblog">
        <button onClick={this.create}>new entry</button>
        {entries}
      </div>
    );
  },

  loadIndex: function(index) {
    var fn = this.addEntry;
    index.forEach(function(indexId) {
      connector.loadEntry(indexId, fn);
    });
  },

  addEntry: function(entry) {
    this.list.push(entry);
    this.setState({ entries: this.list });
  },

  removeEntry: function(entry) {
    var ctime = parseInt(entry.state.meta.created), etime;
    var list = this.list, pos, e;
    for(pos=list.length-1; pos>=0; pos--) {
      e = list[pos];
      var etime = parseInt(e.meta.created);
      if(ctime === etime) break;
    }
    if(pos !== -1) {
      var confirmed = confirm("really delete post?");
      if(confirmed) {
        list.splice(pos,1);
        this.setState({ entries: list });
      }
    }
  },

  create: function() {
    this.addEntry({
      meta: {
        title: "",
        created: Date.now(),
        lastedit: Date.now(),
        published: -1,
        tags: [],
        draft: false,
        deleted: false
      },
      text: "test post",
    });
  },

  delete: function(entry) {
    this.removeEntry(entry);
  },

  formRSS: function() {
    // code goes here
  }

});

