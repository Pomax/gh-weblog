var Editor = React.createClass({

  getInitialState: function() {
    return { text: '' };
  },

  componentDidMount: function() {
    this.setState({ text: this.props.text });
  },

  render: function() {
    return (
      <textarea className="editor"
                hidden={this.props.hidden}
                value={this.state.text}
                onChange={this.record} />
    );
  },

  setText: function(text) {
    this.setState({ text: text });
  },

  record: function(evt) {
    this.setState({ text: evt.target.value });
    this.props.update(evt);
  },

  finish: function(evt) {
    this.props.view();
  }

});
