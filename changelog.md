2010-06-30
==========

* Now using `document.implementation.createDocument` instead of `DOMParser` to create
  DOM documents.
* Tidied up the XML prototype method extension code.


2010-05-27
==========

* Minor speed and minification optimizations.


2010-04-02
==========

* Fixed `methods` variable global leak.
* Removed checks for `DOMParser` and `XMLSerializer`.


2010-03-13
==========

* No longer using version numbers as e4x.js only implements a static feature set.


0.2.2
=====

* Now partially using DOM methods to create a DOM document instead of using string
  serialization for the `xpath()` method.


0.2.1
=====

* Optimizations.
