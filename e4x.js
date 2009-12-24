/*
 * e4x.js
 * Version 0.1.1
 * 
 * e4x.js helps make XML objects and the DOM much more interchangeable. This library
 * implements the optional E4X features described in ECMA-357 2nd Edition Annex A. It
 * also implements Node.xml() and NodeList.xml() and extensions for XML.xpath() such
 * as numeric, string, and boolean return types. Some pre-defined namespaces including
 * XHTML, XHTML2, MathML, SVG, XLink, XForms, XFrames, and XML Events are accessible
 * via XML.namespaces and use common prefixes.
 *
 * 2009-11-21
 * 
 * By Elijah Grey, http://eligrey.com
 * 
 * Copyright (c) 2009 Elijah Grey
 *
 * License: GNU GPL v3 and the X11/MIT license
 *   See COPYING.md
 */

/*global document, XML, XMLList, Namespace, Node, NodeList, DOMParser,
  XMLSerializer, XPathResult*/

/*jslint undef: true, nomen: true, eqeqeq: true, bitwise: true, regexp: true,
  newcap: true, immed: true, maxerr: 1000, maxlen: 90 */

typeof XML !== "undefined" && (function (XML) { // XML param for minification
	"use strict";
	
	var
	proto         = XML.prototype,
	doc           = document,
	xmlMediaType  = "application/xml",
	domParser     = new DOMParser(),
	xmlSerializer = new XMLSerializer(),
	xmlDoc        = domParser.parseFromString("<x/>", xmlMediaType),
	piData        = /<\?[\w\-]+|\?>/g,
	isXMLList     = function (xml) { // this is needed because XML inherits from XMLList
		if (typeof xml !== "xml") {
			return false;
		}
		if (!!xml.length()) { // if 0, XML can only be a XML list
			try {
				xml[0] = xml[0]; // throws error on all non-XML lists
				// don't do this with an empty XMLList
			} catch (ex) {
				return false;
			}
		}
		return true;
	};
	
	proto.function::domNode ||
	(proto.function::domNode = function () {
		var node;
		
		switch (this.nodeKind()) {
			case "element":
				var prettyPrinting = XML.prettyPrinting;
				XML.prettyPrinting = false;
				node = doc.adoptNode(domParser.parseFromString(
					this.toXMLString(), xmlMediaType
				).documentElement);
				XML.prettyPrinting = prettyPrinting;
				return node;
			case "text":
				return doc.createTextNode(this.toString());
			case "comment":
				node = this.toString();
				return doc.createComment(node.substr(4, node.length - 7));
				// equivalent to node.replace(/^<!--|-->$/g, "")
			case "processing-instruction":
				return doc.adoptNode(xmlDoc.createProcessingInstruction(
					this.localName(),
					this.toString().replace(piData, "")
				));
			case "attribute":
				(node = doc.createAttributeNS(
					this.name().uri || null,
					this.localName()
				)).nodeValue = this.toString();
				return node;
		}
	});
	
	proto.function::domNodeList ||
	(proto.function::domNodeList = function () {
		var fragment = doc.createDocumentFragment(),
		i = this.length();
		
		while (i--) {
			fragment.appendChild(this[i].domNode());
		}
		
		return fragment.childNodes;
	});
	
	proto.function::xpath ||
	(proto.function::xpath = function (xpathExp) {
		var res;
		
		if (isXMLList(this)) {
			res = new XMLList();
			var i = this.length();
			while (i--) {
				res = this[i].xpath(xpathExp) + res;
			}
			return res;
		}
		
		var prettyPrinting = XML.prettyPrinting;
		XML.prettyPrinting = false;
		var domDoc = domParser.parseFromString(this.toXMLString(), xmlMediaType),
		xpr = domDoc.evaluate(
			xpathExp,
			domDoc.documentElement,
			domDoc.createNSResolver(domDoc.documentElement),
			XPathResult.ANY_TYPE,
			null
		);
		XML.prettyPrinting = prettyPrinting;
		
		switch (xpr.resultType) {
			case XPathResult.ORDERED_NODE_ITERATOR_TYPE:
			case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
				res = new XMLList();
				var node;
				
				while (node = xpr.iterateNext()) {
					res += node.xml();
				}
				break;
			case XPathResult.NUMBER_TYPE:
				res = xpr.numberValue;
				break;
			case XPathResult.STRING_TYPE:
				res = xpr.stringValue;
				break;
			case XPathResult.BOOLEAN_TYPE:
				res = xpr.booleanValue;
				break;
		}
		
		return res;
	});
	
	XML.ignoreComments =
	XML.ignoreProcessingInstructions = false;
	
	XML.namespaces = {
		XHTML     : new Namespace("xhtml", "http://www.w3.org/1999/xhtml"),
		XHTML2    : new Namespace("xhtml", "http://www.w3.org/2002/06/xhtml2/"),
		MATHML    : new Namespace("mml", "http://www.w3.org/1998/Math/MathML"),
		SVG       : new Namespace("svg", "http://www.w3.org/2000/svg"),
		XLINK     : new Namespace("xlink", "http://www.w3.org/1999/xlink"),
		XFORMS    : new Namespace("xf", "http://www.w3.org/2002/xforms"),
		XFRAMES   : new Namespace("xframes", "http://www.w3.org/2002/06/xframes/"),
		XML_EVENTS: new Namespace("ev", "http://www.w3.org/2001/XML-events")
	};
	
	Node.prototype.xml ||
	(Node.prototype.xml = function () {
		return new XML(xmlSerializer.serializeToString(this));
	});
	
	NodeList.prototype.xml ||
	(NodeList.prototype.xml = function () {
		var res = new XMLList(),
		i = this.length;
		
		while (i--) {
			res = this.item(i).xml() + res;
		}
		return res;
	});
}(XML));
