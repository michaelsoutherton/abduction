function Abduction(target, language) {
	this.document = window.top.getBrowser().selectedBrowser.contentWindow.document;
	this.language = language;
	this.window = this.document.defaultView;
	
	// Prepare event handler:
	this.events = new Events(this);
	
	// Include stylesheet:
	this.styles = this.document.createElement('link');
	this.styles.setAttribute('rel', 'stylesheet');
	this.styles.setAttribute('href', 'resource://abduction/browser.css');
	this.document.documentElement.appendChild(this.styles);
	
	// Add overlay surface:
	this.overlay = new Overlay(this);
	
	// Add selection:
	this.selection = new Selection(this);
	this.selection.setPosition(this.getElementPosition(
		target
			? target
			: this.document.documentElement
	));
	
	// Add 'noticebox' toolbar:
	this.toolbar = new Toolbar(this);
	
	// Remove Abduction on window unload:
	this.events.bind(this.window, 'unload', this.actionRemove);
	
	// Begin moving selection:
	this.events.bind(this.selection.element, 'mousedown', this.actionMove);
}
Abduction.prototype = {
	document: null,
	events: null,
	language: [],
	overlay: null,
	selection: null,
	toolbar: null,
	window: null,
	
	actionKeys: function(event) {
		if (event.keyCode == 27) self.action_close();
		else if (event.keyCode == 13) self.action_save();
		else return;
		
		self.widgets.window.removeEventListener('keydown', self.action_keydown, false);
	},
	
	actionMove: function(event) {
		var stop = function() {
			this.events.unbind(this.selection.element, 'mousemove', move);
			this.events.unbind(this.selection.element, 'mouseup', stop);
			this.events.unbind(this.overlay.element, 'mousemove', move);
			this.events.unbind(this.overlay.element, 'mouseup', stop);
		};
		var move = function(event) {
			var position = this.selection.getPosition();
			var left = (event.pageX + offsetX);
			var top = (event.pageY + offsetY);
			var height = position.height;
			var width = position.width;
			
			if (left < 0) left = 0;
			if (top < 0) top = 0;
			
			if (left + width > this.document.documentElement.scrollWidth) {
				left = this.document.documentElement.scrollWidth - width;
			}
			
			if (top + height > this.document.documentElement.scrollHeight) {
				top = this.document.documentElement.scrollHeight - height;
			}
			
			position.top = top;
			position.left = left;
			
			this.selection.setPosition(position);
		};
		
		var position = this.selection.getPosition();
		var offsetX = position.left - event.pageX;
		var offsetY = position.top - event.pageY;
		
		this.events.bind(this.selection.element, 'mousemove', move);
		this.events.bind(this.selection.element, 'mouseup', stop);
		this.events.bind(this.overlay.element, 'mousemove', move);
		this.events.bind(this.overlay.element, 'mouseup', stop);
		
		return false;
	},
	
	actionSave: function() {
		try {
			var picker = Components.classes["@mozilla.org/filepicker;1"]
				.createInstance(Components.interfaces.nsIFilePicker);
			var io = Components.classes["@mozilla.org/network/io-service;1"]
				.getService(Components.interfaces.nsIIOService);
			
			// Create a 'Save As' dialog:
			picker.init(
				window, label.notice + ' ' + self.filename,
				Components.interfaces.nsIFilePicker.modeSave
			);
			picker.appendFilters(
				Components.interfaces.nsIFilePicker.filterImages
			);
			picker.defaultExtension = '.png';
			picker.defaultString = self.filename + '.png';
			
			// Show picker, cancel on user interaction:
			if (picker.show() == Components.interfaces.nsIFilePicker.returnCancel) return;
			
			// Write the file to disk, without a Download dialog:
			var source = io.newURI(self.getDataURL(), 'utf8', null);
			var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
				.createInstance(Components.interfaces.nsIWebBrowserPersist);
			
			persist.persistFlags = Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
			persist.persistFlags |= Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;
			
			persist.saveURI(source, null, null, null, null, picker.file);
			
			// All done.
			self.action_close();
		}
		
		catch (error) {
			alert(label.sizeerror);
		}
	},
	
	actionRemove: function(event) {
		this.events.remove();
		this.toolbar.remove();
		this.overlay.remove();
		this.selection.remove();
		
		this.document.documentElement.removeChild(this.styles);
	},
	
	actionXRay: function() {
		var stop = function() {
			this.selection.element.className = null;
			this.overlay.element.className = null;
			
			this.events.unbind(this.selection.element, 'mousemove', move);
			this.events.unbind(this.selection.element, 'mousedown', stop);
			this.events.unbind(this.overlay.element, 'mousemove', move);
			this.events.unbind(this.overlay.element, 'mousedown', stop);
		};
		var move = function(event) {
			this.overlay.element.style.zIndex = -10000002;
			this.selection.element.style.zIndex = -10000003;
			
			// Move selection out of the way:
			this.selection.setPosition({
				top:	0,
				left:	0,
				width:	0,
				height: 0
			});
			
			// Move selection above element:
			this.selection.setPosition(
				this.getElementPosition(
					this.document.elementFromPoint(event.clientX, event.clientY)
				)
			);
			
			this.overlay.element.style.zIndex = 10000002;
			this.selection.element.style.zIndex = 10000003;
		};
		
		this.selection.setPosition(
			this.getElementPosition(this.document.documentElement)
		);
		
		this.selection.element.className = 'x-ray';
		this.overlay.element.className = 'x-ray';
		
		this.events.bind(this.selection.element, 'mousemove', move);
		this.events.bind(this.selection.element, 'mousedown', stop);
		this.events.bind(this.overlay.element, 'mousemove', move);
		this.events.bind(this.overlay.element, 'mousedown', stop);
	},
	
	getDocumentTitle: function() {
		return this.document.title
			? this.document.title
			: this.document.URL;
	},
	
	getDataURL: function() {
		var canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'html:canvas');
		var context = canvas.getContext('2d');
		var area = self.selection.getPosition();
		
		canvas.height = selection.height;
		canvas.width = selection.width;
		
		self.overlay.style.display = 'none';
		self.selection.style.display = 'none';
		
		context.drawWindow(
			self.widgets.window,
			area.left,
			area.top,
			area.width,
			area.height,
			'rgb(255, 255, 255)'
		);
		
		self.overlay.style.display = 'block';
		self.selection.style.display = 'block';
		
		return canvas.toDataURL('image/png', '');
	},
	
	getElementPosition: function(element) {
		var result = {
			top:	element.offsetTop,
			left:	element.offsetLeft,
			width:	element.offsetWidth,
			height:	element.offsetHeight
		};
		var parent = element.offsetParent;
		
		while (parent != null) {
			result.left += parent.offsetLeft;
			result.top += parent.offsetTop;
			
			parent = parent.offsetParent;
		}
		
		return result;
	}
}

function Events(parent) {
	this.parent = parent;
}
Events.prototype = {
	active: [],
	parent: null,
	
	createEventHandler: function(callback) {
		var self = this.parent;
		
		return function(event) {
			var result = callback.apply(self, arguments);
			//alert('ok');
			if (result == false) {
				if (event.preventDefault) {
					event.preventDefault();
				}
				
				event.stopPropagation();
			}
		}
	},
	
	bind: function(element, type, callback) {
		var handler = this.createEventHandler(callback);
		
		this.active.push({
			element: element,
			type: type,
			callback: callback,
			handler: handler
		});
		
		element.addEventListener(type, handler, false);
	},
	
	remove: function() {
		this.active.forEach(function(item) {
			item.element.removeEventListener(item.type, item.handler, false);
		});
	},
	
	unbind: function(element, type, callback) {
		this.active = this.active.filter(function(item) {
			if (element != item.element) return true;
			if (type != item.type) return true;
			if (callback != item.callback) return true;
			
			/*
			alert(
				'[ '
				+ item.element.nodeName
				+ '.'
				+ type
				+ ':'
				+ item.type
				+ ' ] '
				+ item.callback.toString()
			);
			*/
			
			item.element.removeEventListener(item.type, item.handler, false);
			
			return false;
		});
	},
};

function Toolbar(parent) {
	this.events = parent.events;
	this.parent = parent;
	this.notices = window.getNotificationBox(parent.window);
	this.notice = this.notices.appendNotification(
		parent.language.notice + ' ' + parent.getDocumentTitle(),
		'abduction-controls', null,
		this.notices.PRIORITY_INFO_HIGH,
		[
			{
				label:		parent.language.autoselect,
				callback:	function() {
					try {
						parent.actionXRay();
						//self.action_auto();
					}
					
					catch (error) {
						alert(error);
					}
					
					return true;
				}
			},
			{
				label:		parent.language.selectall,
				callback:	function() {
					try {
						//self.action_maximize();
					}
					
					catch (error) {
						alert(error);
					}
					
					return true;
				}
			},
			{
				label:		parent.language.save,
				accessKey:	parent.language.accesskey,
				callback:	function() {
					try {
						//self.action_save();
					}
					
					catch (error) {
						alert(error);
					}
					
					return true;
				}
			}
		]
	);
	this.events.bind(this.notice, 'command', parent.actionRemove);
}
Toolbar.prototype = {
	events: null,
	notice: null,
	parent: null,
	
	actionRemove: function() {
		this.events.unbind(this.notice, 'command', parent.actionRemove);
		this.notices.removeNotification(this.notice);
	}
}

function Overlay(parent) {
	this.events = parent.events;
	this.parent = parent;
	this.element = this.parent.document.createElement('abduction-overlay');
	this.parent.document.documentElement.appendChild(this.element);
}
Overlay.prototype = {
	element: null,
	events: null,
	parent: null,
	
	actionRemove: function() {
		this.parent.document.documentElement.removeChild(
			this.element
		);
	}
}

function Selection(parent) {
	this.events = parent.events;
	this.parent = parent;
	this.element = this.parent.document.createElement('abduction-selection');
	this.inner = this.parent.document.createElement('abduction-selection-inner');
	
	this.inner.appendChild(
		this.parent.document.createElement('abduction-selection-top')
	);
	this.inner.appendChild(
		this.parent.document.createElement('abduction-selection-top-left')
	);
	this.inner.appendChild(
		this.parent.document.createElement('abduction-selection-top-right')
	);
	this.inner.appendChild(
		this.parent.document.createElement('abduction-selection-bottom')
	);
	this.inner.appendChild(
		this.parent.document.createElement('abduction-selection-bottom-left')
	);
	this.inner.appendChild(
		this.parent.document.createElement('abduction-selection-bottom-right')
	);
	this.inner.appendChild(
		this.parent.document.createElement('abduction-selection-left')
	);
	this.inner.appendChild(
		this.parent.document.createElement('abduction-selection-right')
	);
	this.parent.document.documentElement.appendChild(this.element);
	this.element.appendChild(this.inner);
}
Selection.prototype = {
	element: null,
	events: null,
	inner: null,
	minimumHeight: 4,
	minimumWidth: 4,
	parent: null,
	
	getPosition: function() {
		return this.parent.getElementPosition(
			this.element
		);
	},
	
	actionRemove: function() {
		this.parent.document.documentElement.removeChild(
			this.element
		);
	},
	
	setPosition: function(position) {
		if (position.height < this.minimumHeight) {
			position.height = this.minimumHeight;
		}
		
		if (position.width < this.minimumWidth) {
			position.width = this.minimumWidth;
		}
		
		this.element.style.height = position.height + 'px';
		this.element.style.left = position.left + 'px';
		this.element.style.top = position.top + 'px';
		this.element.style.width = position.width + 'px';
	}
}