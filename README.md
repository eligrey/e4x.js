e4x.js
======

*Version 0.1*

**e4x.js** is a JavaScript library that helps make XML objects and the DOM much more
interchangeable. This library implements the optional E4X features described in ECMA-357
2nd Edition Annex A. It also implements `Node.xml()` and `NodeList.xml()` and extensions
for `XML.xpath()` such as numeric, string, and boolean types. Many pre-defined namespaces
consisting of XHTML, XHTML2, MathML, SVG, XLink, XForms, XFrames, and XML Events are
accessible via `XML.namespaces` and use common prefixes.

`Node.xml()` returns an XML object representation of the node. `NodeList.xml()` returns
an XML list object representation of the node list.

If you are going to use e4x.js the manipulate the DOM in an (X)HTML document, it is
suggested that you have the following line of code somewhere before using E4X:

    default xml namespace = XML.namespaces.XHTML;
