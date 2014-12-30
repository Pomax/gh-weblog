var OnClickOutside = {
  registerOutsideClickListener: function(handler) {
    if(!handler) return;
    var localNode = this.getDOMNode();
    document.addEventListener("click", function(evt) {
      var source = evt.target;
      var found = false;
      while(source.parentNode) {
        found = (source === localNode);
        if(found) return;
        source = source.parentNode;
      }
      handler(evt);
    });
  }
};
