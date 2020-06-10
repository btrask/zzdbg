#zzdbg: a web debugger in a bookmarklet

zzdbg is a simple but relatively powerful web and Javascript debugger that loads into a web page as a bookmarklet. It's specifically designed for mobile browsers that don't have their own built-in debuggers and which make it too difficult to run your own code.

###Special commands
- `.h`: help
- `.c`: clear output
- `.d expression`: look up the value of the expression or an arbitrary string in the MDN docs
- `.s`: click an element to get a reference to it (use `_` after clicking)

zzdbg also defines the `zzdbg` object that exposes most of its functionality programmatically.

###Known issues
Some pages with strict Content-Security-Policy headers break `eval`, unfortunately.

Only tested in Firefox Mobile.

License: MIT
