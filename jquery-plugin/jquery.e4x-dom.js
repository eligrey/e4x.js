/*
 * jQuery E4X DOM Plugin
 * Version 0.1.5
 * 2010-06-30
 * 
 * The jQuery E4X DOM plugin adds support of interchanging E4X XML and DOM nodes
 * with jQuery through a modified initialization method that converts XML to DOM nodes
 * and a jQuery.fn.xml method that converts DOM nodes to XML. 
 * 
 * By Eli Grey, http://eligrey.com
 * License: The X11/MIT license
 */

/*jslint evil: true, strict: true, undef: true, nomen: true, eqeqeq: true, bitwise: true,
  regexp: true, newcap: true, immed: true, maxerr: 1000, maxlen: 90 */

/*global jQuery, XML, XMLList, XMLSerializer, document */

"use strict";

if (typeof XML !== "undefined") {

(function (XML, $, xmlSerializer) {
	var Init = $.fn.init,
	hostDoc  = document,
	NULL     = null,
	xmlDoc   = hostDoc.implementation.createDocument(NULL, NULL, NULL),
	piName   = /^[\w\-]+\s*/,
	defaultXMLNSProp = "defaultXMLNamespace",
	domNodeList = XML.prototype.function::domNodeList;
	
	if (!domNodeList) {
		var domNode = function (xml) {
			var node;
		
			switch (xml.nodeKind()) {
				case "element":
					var attributes = xml.attributes(),
						children   = xml.children(),
						childLen   = children.length(),
						attLen     = attributes.length(),
						i, attribute;
				
					node = xmlDoc.createElementNS(
						xml.namespace().uri || $[defaultXMLNSProp],
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
							node.appendChild(domNode(children[i]));
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
		};
		domNodeList = function () {
			var fragment = hostDoc.createDocumentFragment();
		
			for (var i = 0, len = this.length(); i < len; i++) {
				fragment.appendChild(hostDoc.adoptNode(domNode(this[i])));
			}
		
			return hostDoc.adoptNode(fragment).childNodes;
		};
	}
	
	// If XML elements don't have a namespace, they will be set to the XHTML 1.x namespace
	$[defaultXMLNSProp] = "http://www.w3.org/1999/xhtml";
	
	$.fn.init = function (selector, context) {
		return new Init(typeof selector === "xml" ? domNodeList.call(selector) : selector,
		                typeof context  === "xml" ? domNodeList.call(context)  : context);
	};
	
	$.fn.xml = function () {
		var xml = new XMLList,
		    i   = 0,
		    len = this.length;
		
		for (; i < len; i++) {
			// Unfortunately, there's no efficient native XML.fromDomNode(node) method
			xml += new XML(xmlSerializer.serializeToString(this[i]));
		}
		
		return xml;
	};
	
	XML.ignoreWhitespace = false;
}(XML, jQuery, new XMLSerializer));

}
