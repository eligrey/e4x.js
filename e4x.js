/*
 * e4x.js
 * Version 0.1
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

(function () {
	"use strict";
	
	var
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
	
	XML.prototype.function::domNode ||
	(XML.prototype.function::domNode = function () {
		var prettyPrinting = XML.prettyPrinting,
		node;
		
		switch (this.nodeKind()) {
			case "element":
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
	
	XML.prototype.function::domNodeList ||
	(XML.prototype.function::domNodeList = function () {
		var fragment = doc.createDocumentFragment(),
		len = this.length(),
		i = 0;
		
		for (; i < len; i++) {
			fragment.appendChild(this[i].domNode());
		}
		
		return fragment.childNodes;
	});
	
	XML.prototype.function::xpath ||
	(XML.prototype.function::xpath = function (xpathExp) {
		var res;
		
		if (isXMLList(this)) {
			res = new XMLList();
			for (var i = 0, len = this.length(); i < len; i++) {
				res += this[i].xpath(xpathExp);
			}
			return res;
		}
		
		var prettyPrinting = XML.prettyPrinting;
		XML.prettyPrinting = false;
		var domDoc = domParser.parseFromString(this.toXMLString(), xmlMediaType),
		iter = domDoc.evaluate(
			xpathExp,
			domDoc.documentElement,
			domDoc.createNSResolver(domDoc.documentElement),
			XPathResult.ANY_TYPE,
			null
		),
		nextNode;
		XML.prettyPrinting = prettyPrinting;
		
		switch (iter.resultType) {
			case XPathResult.ORDERED_NODE_ITERATOR_TYPE:
			case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
				res = new XMLList();
				nextNode = iter.iterateNext();
				while (nextNode) {
					res += nextNode.xml();
					nextNode = iter.iterateNext();
				}
				break;
			case XPathResult.NUMBER_TYPE:
				res = iter.numberValue;
				break;
			case XPathResult.STRING_TYPE:
				res = iter.stringValue;
				break;
			case XPathResult.BOOLEAN_TYPE:
				res = iter.booleanValue;
				break;
		}
		
		return res;
	});
	
	XML.ignoreComments =
	XML.ignoreProcessingInstructions = false;
	if (typeof XML.preserveCDATA !== "undefined") {
		XML.preserveCDATA = true; // https://bugzilla.mozilla.org/show_bug.cgi?id=389123
	}
	
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
		var xmlList = new XMLList(),
		len = this.length,
		i = 0;
		for (; i < len; i++) {
			xmlList += this.item(i).xml();
		}
		return xmlList;
	});
}());
