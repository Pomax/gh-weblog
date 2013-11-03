Github Weblog
=============

A simple weblog that runs entirely off of a gh-pages site,
with content using Markdown syntax (using the most excellent
https://github.com/chjj/marked for github flavoured md).

All the meaningful content is contained in the `gh-weblog`
dir, which means you can submodule, or just copy, this code
into your gh-pages-using-project and in your index.html
add this snippet:

```
<!-- weblog data -->
<link rel="stylesheet" href="gh-weblog/styles/style.css" media="screen">
<script src="gh-weblog/js/main.js"
        onload="setupWebLog({username: 'YourNameHere', repo: 'YourProjectRepoName', path: 'gh-weblog', order: 'newest'})"
        async></script>
```

Set the obvious replacements for `YourNameHere` and
`YourProjectRepoName`, and you're good to go. The scripts
look for an element with id `gh-weblog-entries`, so as long
as you have one of those on your page, you'll be able to
use this gh-blog functionality:

```
<div id="gh-weblog-container"></div>
```

The standard view will generate a dotted circle that acts
as the authentication link - click it, and fill in your
github token (get one on github.com by going to your
account and clicking the applications link, then generating
a token). Irrespective of what you typed, as long as you
typed anything before hitting OK you will now see the
administration buttons, and clicking on posts will turn
them into plain editable markdown formatted text.

* Add a new entry: click the "new Entry" button
* Edit an entry: click its body text, edit it, then click outside the post.
* Remove an entry: click the "Remove entry" button, and confirm (or cancel).

Note that if you filled in an illegal token (or some
nonsense value), you will get the buttons, and the UX,
but it won't do anything. The github API commands will
fail because the token is invalid.

To remove the administration buttons again, simply
authenticate with an empty string.

I guess that's it. Suggestions and pull requests are
always welcome, and you can find my personal version
over at http://pomax.github.io/gh-blog
