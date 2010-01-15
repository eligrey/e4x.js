/*
 * e4x.js
 * Version 0.2.2
 * 
 * e4x.js implements the optional E4X features described in ECMA-357 2nd Edition Annex A.
 *
 * 2010-01-14
 * 
 * By Elijah Grey, http://eligrey.com
 * License: The X11/MIT license (see COPYING.md)
 */

/*global document, XML, XMLList, Namespace, Node, NodeList, DOMParser,
  XMLSerializer, XPathResult*/

/*jslint undef: true, nomen: true, eqeqeq: true, bitwise: true, regexp: true,
  newcap: true, immed: true, maxerr: 1000, maxlen: 90 */

typeof XML !== "undefined" &&
typeof DOMParser !== "undefined" &&
typeof XMLSerializer !== "undefined" &&
(function (XML) { // XML parameter for minification
	"use strict";
	
	var
	proto          = XML.prototype,
	doc            = document,
	xmlMediaType   = "application/xml",
	domParser      = new DOMParser,
	xmlSerializer  = new XMLSerializer,
	createDocumentFrom = function (elem) {
		// XXX: Figure out a way to create a document without DOMParser or implent an
		//      XPath engine for E4X (which would have to be another whole library and be
		//      slower than the native DOM's engine).
		
		var newDoc     = domParser.parseFromString(
			"<" + elem.tagName + "/>", xmlMediaType
		),
		docEl          = newDoc.documentElement,
		childNodes     = elem.childNodes,
		children       = childNodes.length,
		attributeNodes = elem.attributes,
		i              = attributeNodes.length;
		
		while (i--) {
			docEl.setAttributeNode(newDoc.adoptNode(attributeNodes.item(0)));
		}
		
		for (i = 0; i < children; i++) {
			docEl.appendChild(newDoc.adoptNode(childNodes[i]));
		}
		
		return newDoc;
	},
	xmlDoc         = domParser.parseFromString("<x/>", xmlMediaType),
	piName         = /^[\w\-]+\s*/,
	
	xmlToDomNode = function (xml) {
		var node;
		
		switch (xml.nodeKind()) {
			case "element":
				var attributes = xml.attributes(),
				    children   = xml.children(),
				    i, len;
				node = xmlDoc.createElementNS(
					xml.namespace().uri || null,
					xml.localName()
				);
				
				if (attributes.length() !== 0) {
					i = 0;
					len = attributes.length();
					var attribute;
					
					for (; i < len; i++) {
						attribute = attributes[i];
						node.setAttributeNS(
							attribute.namespace().uri || null,
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
			
			case "processing-instruction":
				return xmlDoc.createProcessingInstruction(
					xml.localName(),
					xml.toString().slice(2, -2).replace(piName, "")
				);
			
			case "attribute":
				(node = xmlDoc.createAttributeNS(
					xml.namespace().uri || null,
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
			for (var i = 0, len = this.length(); i < len; i++) {
				res += this[i].xpath(xpathExp);
			}
			return res;
		}
		
		var domDoc = createDocumentFrom(this.domNode()),
		xpr = domDoc.evaluate(
			xpathExp,
			domDoc.documentElement,
			domDoc.createNSResolver(domDoc.documentElement),
			XPathResult.ORDERED_NODE_ITERATOR_TYPE,
			null
		);
		
		var node;
		
		while (node = xpr.iterateNext()) {
			res += new XML(xmlSerializer.serializeToString(node));
		}
		
		return res;
	});
}(XML));
