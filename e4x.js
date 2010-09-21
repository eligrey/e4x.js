/*
 * e4x.js
 * 
 * A JavaScript library that implements the optional E4X features described in
 * ECMA-357 2nd Edition Annex A if they are not already implemented.
 *
 * 2010-06-30
 * 
 * By Eli Grey, http://eligrey.com
 * License: The X11/MIT license (see COPYING.md)
 */

/*global document, XML, XMLList, XMLSerializer, XPathResult */

/*jslint undef: true, nomen: true, eqeqeq: true, bitwise: true, regexp: true,
  newcap: true, immed: true, maxerr: 1000, maxlen: 90 */

/*! @source http://purl.eligrey.com/github/e4x.js/blob/master/e4x.js*/

"use strict";

(function (XML) {
	var hostDoc   = document,
	xmlSerializer = new XMLSerializer,
	piName        = /^[\w\-]+\s*/,
	NULL          = null,
	createDoc     = function (docElem) {
		var domDoc = hostDoc.implementation.createDocument(NULL, NULL, NULL);
		if (docElem) {
			domDoc.appendChild(docElem);
		}
		return domDoc;
	},
	xmlDoc        = createDoc(),
	
	xmlToDomNode = function (xml) {
		var node;
		
		switch (xml.nodeKind()) {
			case "element":
				var attributes = xml.attributes(),
				    children   = xml.children(),
				    childLen   = children.length(),
				    attLen     = attributes.length(),
				    i, attribute;
				
				node = xmlDoc.createElementNS(
					xml.namespace().uri,
					xml.localName()
				);
				
				if (attLen !== 0) {
					for (i = 0; i < attLen; i++) {
						attribute = attributes[i];
						node.setAttributeNS(
							attribute.namespace().uri,
							attribute.localName(),
							attribute.toString()
						);
					}
				}
				if (childLen !== 0) {
					for (i = 0; i < childLen; i++) {
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
					xml.namespace().uri,
					xml.localName()
				)).nodeValue = xml.toString();
				return node;
		}
	},
	xmlMethods = {
		domNode: function () {
			if (this.length() === 1) {
				return hostDoc.adoptNode(xmlToDomNode(this));
			}
		},
		domNodeList: function () {
			var fragment = hostDoc.createDocumentFragment();
		
			for (var i = 0, len = this.length(); i < len; i++) {
				fragment.appendChild(this[i].domNode());
			}
		
			return hostDoc.adoptNode(fragment).childNodes;
		},
		xpath: function (xpathExp) {
			var res = new XMLList,
			    len = this.length();
	
			if (len !== 1) {
				for (var i = 0, len = len; i < len; i++) {
					res += this[i].xpath(xpathExp);
				}
				return res;
			}
	
			var domDoc = createDoc(this.domNode()),
			xpr = domDoc.evaluate(
				xpathExp,
				domDoc.documentElement,
				domDoc.createNSResolver(domDoc.documentElement),
				XPathResult.ORDERED_NODE_ITERATOR_TYPE,
				NULL
			),
			node;
	
			while (node = xpr.iterateNext()) {
				// Unfortunately, there's no efficient native XML.fromDomNode(node) method
				res += new XML(xmlSerializer.serializeToString(node));
			}
	
			return res;
		}
	},
	method;
	
	for (method in xmlMethods) {
		if (xmlMethods.hasOwnProperty(method) && !XML.prototype.function::[method]) {
			XML.prototype.function::[method] = xmlMethods[method];
		}
	}
}(XML));
