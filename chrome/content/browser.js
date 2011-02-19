function Abduction(target, language) {
	this.document = window.top.getBrowser().selectedBrowser.contentWindow.document;
	this.language = language;
	this.window = this.document.defaultView;
	
	// Prepare the console:
	this.console = new Console();
	this.console.enableMessages = true;
	
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
	
	// Scroll automatically:
	var scroll = new Scrollable(this.window);
	
	scroll.bind(this.selection.element);
	scroll.bind(this.overlay.element);
	
	this.console.log('Abduction: begins');
}
Abduction.prototype = {
	console: null,
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
	
	actionRemove: function(event) {
		this.events.actionRemove();
		this.toolbar.actionRemove();
		this.overlay.actionRemove();
		this.selection.actionRemove();
		
		this.events.unbind(this.selection.element, 'mousedown', this.actionMove);
		this.events.unbind(this.overlay.element, 'mousemove', this.actionScroll);
		this.events.unbind(this.window, 'unload', this.actionRemove);
		
		this.document.documentElement.removeChild(this.styles);
		
		this.console.log('Abduction: ends');
	},
	
	actionSave: function() {
		try {
			var picker = Components.classes["@mozilla.org/filepicker;1"]
				.createInstance(Components.interfaces.nsIFilePicker);
			var io = Components.classes["@mozilla.org/network/io-service;1"]
				.getService(Components.interfaces.nsIIOService);
			var title = this.getDocumentTitle();
			
			// Create a 'Save As' dialog:
			picker.init(
				window, this.language.notice + ' ' + title,
				Components.interfaces.nsIFilePicker.modeSave
			);
			picker.appendFilters(
				Components.interfaces.nsIFilePicker.filterImages
			);
			picker.defaultExtension = '.png';
			picker.defaultString = title + '.png';
			
			// Show picker, cancel on user interaction:
			if (picker.show() == Components.interfaces.nsIFilePicker.returnCancel) return;
			
			// Write the file to disk, without a Download dialog:
			var source = io.newURI(this.getDataURL(), 'utf8', null);
			var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
				.createInstance(Components.interfaces.nsIWebBrowserPersist);
			
			persist.persistFlags = Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
			persist.persistFlags |= Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;
			
			persist.saveURI(source, null, null, null, null, picker.file);
			
			// All done.
			this.actionRemove();
		}
		
		catch (error) {
			this.console.error(error);
			alert(this.language.sizeerror);
		}
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
	
	getDataURL: function() {
		var canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'html:canvas');
		var context = canvas.getContext('2d');
		var area = this.selection.getPosition();
		
		canvas.height = area.height;
		canvas.width = area.width;
		
		this.overlay.element.style.display = 'none';
		this.selection.element.style.display = 'none';
		
		context.drawWindow(
			this.window,
			area.left,
			area.top,
			area.width,
			area.height,
			'rgb(255, 255, 255)'
		);
		
		this.overlay.element.style.display = 'block';
		this.selection.element.style.display = 'block';
		
		return canvas.toDataURL('image/png', '');
	},
	
	getDocumentTitle: function() {
		return this.document.title
			? this.document.title
			: this.document.URL;
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

function Console() {
	this.service = Components.classes["@mozilla.org/consoleservice;1"]
		.getService(Components.interfaces.nsIConsoleService);
}
Console.prototype = {
	enableErrors: true,
	enableMessages: false,
	service: null,
	
	error: function(message) {
		if (this.enableErrors) Components.utils.reportError(message);
	},
	
	log: function(message) {
		if (this.enableMessages) this.service.logStringMessage(message);
	}
};

function Events(parent) {
	this.parent = parent;
}
Events.prototype = {
	active: [],
	parent: null,
	
	actionRemove: function() {
		this.active.forEach(function(item) {
			item.element.removeEventListener(item.type, item.handler, false);
		});
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
	
	unbind: function(element, type, callback) {
		this.active = this.active.filter(function(item) {
			if (element != item.element) return true;
			if (type != item.type) return true;
			if (callback != item.callback) return true;
			
			item.element.removeEventListener(item.type, item.handler, false);
			
			return false;
		});
	},
};

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

/**
* Scrolls the document when the mouse is close to the edge.
*/
function Scrollable(window) {
	this.console = new Console();
	//this.console.enableMessages = true;
	this.document = window.document;
	this.events = new Events(this);
	this.window = window;
}
Scrollable.prototype = {
	console: null,
	document: null,
	events: null,
	window: null,
	
	// Multiplies the speed every timeout:
	scrollAcceleration: 1.02,
	
	// Distance from edge before scrolling:
	scrollEdgeSpace: 50,
	
	// Maximum scroll size in pixels:
	scrollMaxSpeed: 70,
	
	// Current scroll speeds:
	scrollSpeedX: 0,
	scrollSpeedY: 0,
	
	// How often scrolling should update:
	scrollTimeoutRate: 20,
	
	bind: function(element) {
		this.events.bind(element, 'mousemove', this.actionScroll);
	},
	
	actionRemove: function(element) {
		this.events.actionRemove();
	},
	
	actionScroll: function(event) {
		// Start scrolling left or right:
		if (this.scrollSpeedX == 0) {
			if (event.clientX > this.window.innerWidth - this.scrollEdgeSpace) {
				this.scrollSpeedX = 3;
			}
			
			if (event.clientX < this.scrollEdgeSpace) {
				this.scrollSpeedX = -3;
			}
			
			if (this.scrollSpeedX != 0) {
				this.console.log('Abduction: scroll x begins');
				
				this.actionScrollX();
			}
		}
		
		else {
			if (this.scrollSpeedX > 0 && event.clientX <= this.window.innerWidth - this.scrollEdgeSpace) {
				this.scrollSpeedX = 0;
			}
			
			if (this.scrollSpeedX < 0 && event.clientX >= this.scrollEdgeSpace) {
				this.scrollSpeedX = 0;
			}
			
			if (this.scrollSpeedX == 0) {
				this.console.log('Abduction: scroll x ends');
			}
		}
		
		// Start scrolling down or up:
		if (this.scrollSpeedY == 0) {
			if (event.clientY > this.window.innerHeight - this.scrollEdgeSpace) {
				this.scrollSpeedY = 3;
			}
			
			if (event.clientY < this.scrollEdgeSpace) {
				this.scrollSpeedY = -3;
			}
			
			if (this.scrollSpeedY != 0) {
				this.console.log('Abduction: scroll y begins');
				
				this.actionScrollY();
			}
		}
		
		else {
			if (this.scrollSpeedY > 0 && event.clientY <= this.window.innerHeight - this.scrollEdgeSpace) {
				this.scrollSpeedY = 0;
			}
			
			if (this.scrollSpeedY < 0 && event.clientY >= this.scrollEdgeSpace) {
				this.scrollSpeedY = 0;
			}
			
			if (this.scrollSpeedY == 0) {
				this.console.log('Abduction: scroll y ends');
			}
		}
	},
	
	actionScrollX: function() {
		if (this.scrollSpeedX == 0) return;
		
		this.console.log('Abduction: scroll x');
		
		this.document.documentElement.scrollLeft += this.scrollSpeedX;
		
		this.scrollSpeedX *= this.scrollAcceleration;
		
		if (this.scrollSpeedX > 0 && this.scrollSpeedX > this.scrollMaxSpeed) {
			this.scrollSpeedX = this.scrollMaxSpeed;
		}
		
		if (this.scrollSpeedX < 0 && this.scrollSpeedX < 0 - this.scrollMaxSpeed) {
			this.scrollSpeedX = 0 - this.scrollMaxSpeed;
		}
		
		if (this.scrollSpeedX != 0) setTimeout(
			this.actionScrollX.bind(this),
			this.scrollTimeoutRate
		);
	},
	
	actionScrollY: function() {
		if (this.scrollSpeedY == 0) return;
		
		this.console.log('Abduction: scroll y');
		
		this.document.documentElement.scrollTop += this.scrollSpeedY;
		
		this.scrollSpeedY *= this.scrollAcceleration;
		
		if (this.scrollSpeedY > 0 && this.scrollSpeedY > this.scrollMaxSpeed) {
			this.scrollSpeedY = this.scrollMaxSpeed;
		}
		
		if (this.scrollSpeedY < 0 && this.scrollSpeedY < 0 - this.scrollMaxSpeed) {
			this.scrollSpeedY = 0 - this.scrollMaxSpeed;
		}
		
		if (this.scrollSpeedY != 0) setTimeout(
			this.actionScrollY.bind(this),
			this.scrollTimeoutRate
		);
	},
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
					}
					
					catch (error) {
						parent.console.error(error);
					}
					
					return true;
				}
			},
			{
				label:		parent.language.selectall,
				callback:	function() {
					try {
						//parent.actionSelectAll();
					}
					
					catch (error) {
						parent.console.error(error);
					}
					
					return true;
				}
			},
			{
				label:		parent.language.save,
				accessKey:	parent.language.accesskey,
				callback:	function() {
					try {
						parent.actionSave();
					}
					
					catch (error) {
						parent.console.error(error);
						//alert(error.name + ': ' + error);
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