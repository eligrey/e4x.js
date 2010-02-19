/*
 * jQuery E4X DOM Plugin
 * Version 0.1.2
 * 2010-02-18
 * 
 * By Elijah Grey, http://eligrey.com
 * License: The X11/MIT license
 */

/*jslint evil: true, undef: true, nomen: true, eqeqeq: true, bitwise: true,
  regexp: true, newcap: true, immed: true, maxerr: 1000, maxlen: 90 */

/*global jQuery, XML, XMLList, DOMParser, XMLSerializer, document */

if (typeof XML !== "undefined") {

// Modifications that convert XML to DOM NodeLists when passing them to jQuery
if (typeof DOMParser !== "undefined") {

(function ($) {
	"use strict";
	
	var Init = jQuery.fn.init,
	doc      = document,
	xmlDoc   = (new DOMParser).parseFromString("<x/>", "application/xml"),
	piName   = /^[\w\-]+\s*/,
	domNodeList;
	
	try {
		// In case the script type doesn't include ;e4x=1 and XML is defined and
		// a non-E4X-supporting browser somehow gets this far
		domNodeList = eval("XML.prototype.function::domNodeList");
	} catch (e) {
		return;
	}
	
	if (!domNodeList) {
		var domNode = function (xml) {
			var node;
		
			switch (xml.nodeKind()) {
				case "element":
					var attributes = xml.attributes(),
						children   = xml.children(),
						i, len;
					node = xmlDoc.createElementNS(
						xml.namespace().uri,
						xml.localName()
					);
				
					if (attributes.length() !== 0) {
						i = 0;
						len = attributes.length();
						var attribute;
					
						for (; i < len; i++) {
							attribute = attributes[i];
							node.setAttributeNS(
								attribute.namespace().uri,
								attribute.localName(),
								attribute.toString()
							);
						}
					}
					if (children.length() !== 0) {
						i = 0;
						len = children.length();
					
						for (; i < len; i++) {
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
			var fragment = doc.createDocumentFragment();
		
			for (var i = 0, len = this.length(); i < len; i++) {
				fragment.appendChild(doc.adoptNode(domNode(this[i])));
			}
		
			return doc.adoptNode(fragment).childNodes;
		};
	}
	
	$.fn.init = function (selector, context) {
		return new Init(typeof selector === "xml" ? domNodeList.call(selector) : selector,
		                typeof context  === "xml" ? domNodeList.call(context)  : context);
	};
	
	XML.ignoreWhitespace = false;
}(jQuery));

}


// jQuery.fn.xml - Enables converting jQuery objects into XMLLists.
if (typeof XMLSerializer !== "undefined") {

(function ($, xmlSerializer) {
	$.fn.xml = function () {
		var xml = new XMLList,
		    i   = 0,
		    len = this.length;
		
		for (; i < len; i++) {
			xml += new XML(xmlSerializer.serializeToString(this[i]));
		}
		
		return xml;
	};
}(jQuery, new XMLSerializer));

}

// Try to set the default XML namespace to the XHTML namespace.
// It's outside the functions so it affects the global scope.
try {
	eval("default xml namespace='http://www.w3.org/1999/xhtml'");
} catch (e) {}

}
