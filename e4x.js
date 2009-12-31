/*
 * e4x.js
 * Version 0.2
 * 
 * e4x.js implements the optional E4X features described in ECMA-357 2nd Edition Annex A.
 *
 * 2009-12-30
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

typeof XML !== "undefined" && (function (XML) { // XML parameter for minification
	"use strict";
	
	var
	proto         = XML.prototype,
	doc           = document,
	xmlMediaType  = "application/xml",
	domParser     = new DOMParser,
	xmlSerializer = new XMLSerializer,
	xmlDoc        = domParser.parseFromString("<x/>", xmlMediaType),
	piWrapper     = /<\?[\w\-]+|\?>/g,
	
	xmlToDomNode = function (xml) {
		var node;
		
		switch (xml.nodeKind()) {
			case "element":
				var attributes = xml.attributes(),
				    children   = xml.children(),
				    i, len;
				node = xmlDoc.createElementNS(
					xml.name().uri || null,
					xml.localName()
				);
				
				if (attributes.length() !== 0) {
					i = 0;
					len = attributes.length();
					var attribute;
					
					for (; i < len; i++) {
						attribute = attributes[i];
						node.setAttributeNS(
							attribute.name().uri || null,
							attribute.localName(),
							attribute.toString()
						);
					}
				}
				if (children.length() !== 0) {
					i = 0;
					len = children.length();
					
					for (; i < len; i++) {
						node.appendChild(xmlToDomNode(children[i]));
					}
				}
				
				return node;
			
			case "text":
				return xmlDoc.createTextNode(xml.toString());
			
			case "comment":
				return xmlDoc.createComment(xml.toString().slice(4, -3));
				// equivalent to node.replace(/^<!--|-->$/g, "") for comments
			
			case "processing-instruction":
				return xmlDoc.createProcessingInstruction(
					xml.localName(),
					xml.toString().replace(piWrapper, "")
				);
			
			case "attribute":
				(node = xmlDoc.createAttributeNS(
					xml.name().uri || null,
					xml.localName()
				)).nodeValue = xml.toString();
				return node;
		}
	};
	
	proto.function::domNode ||
	(proto.function::domNode = function () {
		if (this.length() !== 1) {
			return;
		}
		
		return doc.adoptNode(xmlToDomNode(this));
	});
	
	proto.function::domNodeList ||
	(proto.function::domNodeList = function () {
		var fragment = doc.createDocumentFragment();
		
		for (var i = 0, len = this.length(); i < len; i++) {
			fragment.appendChild(this[i].domNode());
		}
		
		return doc.adoptNode(fragment).childNodes;
	});
	
	proto.function::xpath ||
	(proto.function::xpath = function (xpathExp) {
		var res = new XMLList;
		
		if (this.length() !== 1) {
			var i = this.length();
			while (i--) {
				res = this[i].xpath(xpathExp) + res;
			}
			return res;
		}
		
		// XXX: Figure out a way to somehow construct a DOM document from a DOM element.
		var prettyPrinting = XML.prettyPrinting;
		XML.prettyPrinting = false;
		var domDoc = domParser.parseFromString(this.toXMLString(), xmlMediaType),
		xpr = domDoc.evaluate(
			xpathExp,
			domDoc.documentElement,
			domDoc.createNSResolver(domDoc.documentElement),
			XPathResult.ORDERED_NODE_ITERATOR_TYPE,
			null
		);
		XML.prettyPrinting = prettyPrinting;
		
		var node;
		
		while (node = xpr.iterateNext()) {
			res += new XML(xmlSerializer.serializeToString(node));
		}
		
		return res;
	});
}(XML));
