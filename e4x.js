/*
 * e4x.js
 * 
 * A JavaScript library that implements the optional E4X features described in
 * ECMA-357 2nd Edition Annex A if they are not already implemented.
 *
 * 2010-05-27
 * 
 * By Eli Grey, http://eligrey.com
 * License: The X11/MIT license (see COPYING.md)
 */

/*global document, XML, XMLList, DOMParser, XMLSerializer, XPathResult */

/*jslint undef: true, nomen: true, eqeqeq: true, bitwise: true, regexp: true,
  newcap: true, immed: true, maxerr: 1000, maxlen: 90 */

"use strict";

(function (XML) {
	var doc       = document,
	xmlMediaType  = "application/xml",
	domParser     = new DOMParser,
	xmlSerializer = new XMLSerializer,
	createDocumentFrom = function (elem) {
		// XXX: Figure out a way to create a document without DOMParser or implent an
		//      XPath engine for E4X (which would have to be another whole library and be
		//      slower than the native DOM's engine).
		
		var newDoc     = domParser.parseFromString(
			"<" + elem.localName + "/>", xmlMediaType
		),
		docEl          = newDoc.documentElement,
		childNodes     = elem.childNodes,
		children       = childNodes.length,
		attributeNodes = elem.attributes,
		i              = attributeNodes.length;
		
		while (i--) {
			docEl.setAttributeNode(newDoc.adoptNode(attributeNodes.item(0)));
		}
		
		for (i++; i < children; i++) {
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
	extendXMLProto = function (methods) {
		for (var method in methods) {
			if (methods.hasOwnProperty(method) && !XML.prototype.function::[method]) {
				XML.prototype.function::[method] = methods[method];
			}
		}
	};
	
	extendXMLProto({
		domNode: function () {
			if (this.length() === 1) {
				return doc.adoptNode(xmlToDomNode(this));
			}
		},
		domNodeList: function () {
			var fragment = doc.createDocumentFragment();
		
			for (var i = 0, len = this.length(); i < len; i++) {
				fragment.appendChild(this[i].domNode());
			}
		
			return doc.adoptNode(fragment).childNodes;
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
	
			var domDoc = createDocumentFrom(this.domNode()),
			xpr = domDoc.evaluate(
				xpathExp,
				domDoc.documentElement,
				domDoc.createNSResolver(domDoc.documentElement),
				XPathResult.ORDERED_NODE_ITERATOR_TYPE,
				null
			),
			node;
	
			while (node = xpr.iterateNext()) {
				res += new XML(xmlSerializer.serializeToString(node));
			}
	
			return res;
		}
	});
}(XML));
