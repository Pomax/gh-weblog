var React = require("react");

module.exports = React.createClass({

  render: function() {
    var tags = this.props.tags.map(function(tag,idx) {
      return <div className="tag" key={idx}>{tag}</div>;
    });
    return <div className="tags" onClick={this.updateTags}>{tags}</div>;
  },

  updateTags: function() {
    if(this.props.disabled) return;
    var tags = this.props.tags.join(", ");
    var newtags = prompt("Edit the post tags", tags);
    tags = newtags.split(",").map(function(v) { return v.trim(); });
    this.props.onChange(tags);
  }

});
