// From http://stackoverflow.com/questions/18377891


//cliboard pasting class
function ClipboardClass(handler) {
  // firefox shim
  document.addEventListener('keydown', function(evt) { this.on_keyboard_action(evt); }.bind(this));
  document.addEventListener('keyup',   function(evt) { this.on_keyboardup_action(evt); }.bind(this));
  // official paste handler
  document.addEventListener('paste',   function(evt) { this.paste_auto(evt); }.bind(this));
  this.init(handler);
}

ClipboardClass.prototype = {
  ctrl_pressed: false,

  shim: document.createElement("div"),

  init: function(handler) {
    var self = this;

    // shim a catching element for firefox
    var shim = this.shim = document.createElement("div");
    shim.setAttribute("id", "paste_ff");
    shim.setAttribute("contenteditable", "contenteditable");
    shim.style.cssText = 'opacity:0;position:fixed;top:0px;left:0px;';
    shim.style.marginLeft = "-20px";
    shim.style.width = "10px";
    document.body.appendChild(shim);

    shim.addEventListener('DOMSubtreeModified', function() {
      if(!self.ctrl_pressed) return true;

      //if paste handle failed - capture pasted object manually
      if(shim.children.length > 0) {
        if (shim.firstElementChild.src) {
          console.log("SRC", shim.firstElementChild.src);
        }
        else {
          setTimeout(function() {
            if (self.reading_dom) return false;
            console.log("TEXT", shim.innerHTML);
            setTimeout(function() { shim.innerHTML = ""; }, 10);
            self.reading_dom = true;
          }, 1);
        }
      }

      else if(!shim.children.length){
        setTimeout(function(){
          if (self.reading_dom) return false;
          console.log("TEXT (2)", shim.innerHTML);
          setTimeout(function() { shim.innerHTML = ""; }, 10);
          self.reading_dom = true;
        }, 1);
      }
    });
  },

  //default paste action
  paste_auto: function(evt) {
    this.shim.innerHTML = '';
    if (evt.clipboardData) {
      var items = evt.clipboardData.items;
      if (items) {

        //access data directly
        for (var i = 0; i < items.length; i++) {

          if (items[i].type.indexOf("image") !== -1) {
            var filedata = items[i].getAsFile();
            var source = URL.createObjectURL(filedata);
            console.log("SRC (2)", source);
          }

          else if (items[i].type.indexOf("text") !== -1) {
            var data = evt.clipboardData.getData('text/plain');
            console.log("TEXT (3)", data);
          }
        }
        evt.preventDefault();
      } else {
        // wait for DOMSubtreeModified event
        // https://bugzilla.mozilla.org/show_bug.cgi?id=891247
      }
    }
  },

  // on keyboard press for ctrl/cmd/meta + v
  on_keyboard_action: function(event) {
    var key = event.keyCode;
    if ((key === 17 || event.metaKey || event.ctrlKey) && !this.ctrl_pressed) this.ctrl_pressed = true;
    if (key === 86 && (this.ctrl_pressed && !window.Clipboard)) this.shim.focus();
  },

  // on kaybord release
  on_keyboardup_action: function(event) {
    if (event.keyCode === 17 || event.metaKey || event.ctrlKey || event.key == 'Meta') {
      this.ctrl_pressed = false;
    }
  }
};

var cc = new ClipboardClass();
