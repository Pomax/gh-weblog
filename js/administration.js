(function() {

  if(!window["gh-weblog"]) { window["gh-weblog"] = {}; }

  var context = window["gh-weblog"];

  context.newEntry = function newEntry(uid) {
    uid = uid || Date.now();
    console.log("new entry " + uid);
    var entryObject = {
      title: "",
      author: "",
      content: "",
      published: uid,
      updated: uid
    };
    window['gh-weblog'].entries[""+uid] = entryObject;
  };

  context.parseEntry = function parseEntry(entry) {
    console.log("parse entry " + entry.id);
    var content = entry.querySelector(".content"),
        ocontent = entry.querySelector(".original.content");
    content.innerHTML = markdown.toHTML(content.textContent);
    [content, ocontent].forEach(function(e) {
      e.show = function() { e.classList.remove("hidden"); }
      e.hide = function() { e.classList.add("hidden"); }
    });
  };

  context.editEntry = function editEntry(uid) {
    console.log("edit entry " + uid);
    if(!uid) return;
    var entry = document.getElementById("gh-weblog-"+uid),
        content = entry.querySelector(".content"),
        ocontent = entry.querySelector(".hidden.original.content");
    // switcharoo
    content.hide();
    ocontent.show();
    ocontent.focus();
  };

  context.updateEntry = function updateEntry(uid, ocontent) {
    console.log("update entry " + uid);
    if(!uid) return;
    var entry = document.getElementById("gh-weblog-"+uid);
    var content = entry.querySelector(".content");
    var newContent = ocontent.value;
    // administrate the entry
    var entryObject = window['gh-weblog'].entries[""+uid];
    entryObject.content = newContent;
    entryObject.updated = Date.now();
    // reswitcharoo
    ocontent.hide();
    content.innerHTML = markdown.toHTML(newContent);
    content.show();
  };

  context.saveEntry = function saveEntry(uid) {
    console.log("save entry " + uid);
    if(!uid) return;
    var entryObject = window['gh-weblog'].entries[""+uid];
    var entryString = JSON.stringify(entryObject);
  };

  context.removeEntry = function removeEntry(uid) {
    console.log("remove entry " + uid);
    if(!uid) return;
  };

}());
