var Editor = React.createClass({

  getInitialState: function() {
    return { text: '' };
  },

  componentDidMount: function() {
    this.setState({ text: this.props.text });
  },

  render: function() {
    return (
      <div className="edits">
        <textarea hidden={this.props.hidden}
                  value={this.state.text}
                  onChange={this.record} />
        <button hidden={this.props.hidden}
                onClick={this.props.onDelete}>delete</button>
        <button hidden={this.props.hidden}
                onClick={this.finish}>done</button>
      </div>
    );
  },

  setText: function(text) {
    this.setState({ text: text });
  },

  record: function(evt) {
    this.setState({ text: evt.target.value });
    this.props.onChange(evt);
  },

  finish: function(evt) {
    this.props.onDone(evt);
  }

});
