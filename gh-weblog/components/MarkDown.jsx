var React = require("react");
var marked = require("../bower_components/marked/lib/marked");
module.exports = React.createClass({
  render: function() {
    var html = {__html: marked(this.props.text)};
    return <div ref="post"
                className="post"
                hidden={this.props.hidden}
                onClick={this.props.onClick}
                dangerouslySetInnerHTML={html}/>
  },
  getHTML: function() {
    return this.refs.post.getDOMNode().innerHTML
  }
});
