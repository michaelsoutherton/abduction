var abduction = function(target, label) {
	var setting = {
		min_height:			4,
		min_width:			4,
		scroll_factor:		0.5
	};
	
	var widget = {
		window:				null,
		document:			null,
		root:				null,
		body:				null,
		overlay:			null,
		selection:			null,
		selection_top:		null,
		selection_bottom:	null,
		selection_left:		null,
		selection_right:	null
	};
	
	var get_position = function(element) {
		var result = {
			left:	0,
			top:	0,
			height:	element.offsetHeight,
			width:	element.offsetWidth
		};
		
		if (element.offsetParent) {
			do {
				result.left += element.offsetLeft;
				result.top += element.offsetTop;
			}
			
			while (element == element.offsetParent);
		}
		
		return result;
	};
	
	var scroll_to_y = function(min_y, max_y) {
		var scroll_up = Math.round(
			(24 - min_y + widget.root.scrollTop) * setting.scroll_factor
		);
		var scroll_down = Math.round(
			(24 + max_y - widget.overlay.offsetHeight - widget.root.scrollTop) * setting.scroll_factor
		);
		
		if (scroll_up > 0) {
			widget.root.scrollTop -= scroll_up;
		}
		
		else if (scroll_down > 0) {
			widget.root.scrollTop += scroll_down;
		}
	};
	
	var scroll_to_x = function(min_x, max_x) {
		var scroll_left = Math.round(
			(24 - min_x + widget.root.scrollLeft) * setting.scroll_factor
		);
		var scroll_down = Math.round(
			(24 + max_x - widget.overlay.offsetWidth - widget.root.scrollLeft) * setting.scroll_factor
		);
		
		if (scroll_left > 0) {
			widget.root.scrollLeft -= scroll_left;
		}
		
		else if (scroll_down > 0) {
			widget.root.scrollLeft += scroll_down;
		}
	};
	
	var event_connect = function(target, event, listener) {
		target.addEventListener(event, listener, false);
	};
	
	var event_release = function(target, event, listener) {
		target.removeEventListener(event, listener, false);
	};
	
	var event_stop = function(event) {
		if (event.preventDefault) {
			event.preventDefault();
		}
		
		event.stopPropagation();
	};
	
	var action_move = function(event) {
		var stop = function() {
			event_release(widget.selection, 'mousemove', move)
			event_release(widget.selection, 'mouseup', stop);
			event_release(widget.overlay, 'mousemove', move)
			event_release(widget.overlay, 'mouseup', stop);
			event_release(widget.document, 'mouseleave', stop);
		};
		var move = function(event) {
			var position = get_position(widget.selection);
			var left = (event.pageX + offsetX);
			var top = (event.pageY + offsetY);
			var height = position.height;
			var width = position.width;
			
			if (left < 0) left = 0;
			if (top < 0) top = 0;
			
			if (left + width > widget.root.scrollWidth) {
				left = widget.root.scrollWidth - width;
			}
			
			if (top + height > widget.root.scrollHeight) {
				top = widget.root.scrollHeight - height;
			}
			
			scroll_to_y(top, top + height);
			scroll_to_x(left, left + width);
			
			widget.selection.style.left = left + 'px';
			widget.selection.style.top = top + 'px';
		};
		
		if (action_maximize_state != null) return;
		
		var position = get_position(widget.selection);
		var offsetX = position.left - event.pageX;
		var offsetY = position.top - event.pageY;
		
		event_connect(widget.selection, 'mousemove', move)
		event_connect(widget.selection, 'mouseup', stop);
		event_connect(widget.overlay, 'mousemove', move)
		event_connect(widget.overlay, 'mouseup', stop);
		event_connect(widget.document, 'mouseleave', stop);
		event_stop(event);
	};
	
	// Maximze selection:
	var action_maximize_state = null;
	var action_maximize = function(event) {
		if (action_maximize_state != null) {
			var position = action_maximize_state;
			var height = position.height;
			var width = position.width;
			var top = position.top;
			var left = position.left;
			
			action_maximize_state = null;
		}
		
		else {
			var height = widget.root.scrollHeight;
			var width = widget.root.scrollWidth;
			var top = 0, left = 0;
			
			action_maximize_state = get_position(widget.selection);
		}
		
		widget.selection.style.height = height + 'px';
		widget.selection.style.left = left + 'px';
		widget.selection.style.top = top + 'px';
		widget.selection.style.width = width + 'px';
		
		event_stop(event);
	};
	
	var init_selection_top = function(event) {
		var selection = get_position(widget.selection);
		
		return {
			selection:	selection,
			offset:		selection.top - event.pageY,
			height:		selection.height + selection.top
		};
	};
	
	var init_selection_bottom = function(event) {
		var selection = get_position(widget.selection);
		
		return {
			selection:	selection,
			offset:		selection.height - event.pageY
		};
	};
	
	var init_selection_left = function(event) {
		var selection = get_position(widget.selection);
		
		return {
			selection:	selection,
			offset:		selection.left - event.pageX,
			width:		selection.width + selection.left
		};
	};
	
	var init_selection_right = function(event) {
		var selection = get_position(widget.selection);
		
		return {
			selection:	selection,
			offset:		selection.width - event.pageX
		};
	};
	
	var set_selection_top = function(event, context) {
		var top = event.pageY + context.offset;
		var height = context.height;
		
		if (top < 0) top = 0;
		
		if (height - top < setting.min_height) {
			height = setting.min_height;
			top = context.height - height;
		}
		
		else {
			height -= top;
		}
		
		scroll_to_y(event.pageY, event.pageY);
		
		widget.selection.style.height = height + 'px';
		widget.selection.style.top = top + 'px';
	};
	
	var set_selection_bottom = function(event, context) {
		var height = (event.pageY + context.offset);
		
		if (height < setting.min_height) {
			height = setting.min_height;
		}
		
		if (context.selection.top + height > widget.root.scrollHeight) {
			height = widget.root.scrollHeight - context.selection.top;
		}
		
		scroll_to_y(event.pageY, event.pageY);
		
		widget.selection.style.height = height + 'px';
	};
	
	var set_selection_left = function(event, context) {
		var left = event.pageX + context.offset;
		var width = context.width;
		
		if (left < 0) left = 0;
		
		if (width - left < setting.min_width) {
			width = setting.min_width;
			left = context.width - width;
		}
		
		else {
			width -= left;
		}
		
		scroll_to_x(event.pageX, event.pageX);
		
		widget.selection.style.width = width + 'px';
		widget.selection.style.left = left + 'px';
	};
	
	var set_selection_right = function(event, context) {
		var width = (event.pageX + context.offset);
		
		if (width < setting.min_width) {
			width = setting.min_width;
		}
		
		if (context.selection.left + width > widget.root.scrollWidth) {
			width = widget.root.scrollWidth - context.selection.left;
		}
		
		scroll_to_x(event.pageX, event.pageX);
		
		widget.selection.style.width = width + 'px';
	};
	
	// Resize top:
	var action_top = function(event) {
		var stop = function() {
			widget.overlay.setAttribute('state', '');
			widget.selection.setAttribute('state', '');
			
			event_release(widget.selection, 'mousemove', move)
			event_release(widget.selection, 'mouseup', stop);
			event_release(widget.overlay, 'mousemove', move)
			event_release(widget.overlay, 'mouseup', stop);
			event_release(widget.document, 'mouseleave', stop);
		};
		var move = function(event) {
			widget.overlay.setAttribute('state', 'resize-top');
			widget.selection.setAttribute('state', 'resize-top');
			
			set_selection_top(event, context_top);
		};
		
		var context_top = init_selection_top(event);
		
		action_maximize_state = null;
		
		event_connect(widget.selection, 'mousemove', move)
		event_connect(widget.selection, 'mouseup', stop);
		event_connect(widget.overlay, 'mousemove', move)
		event_connect(widget.overlay, 'mouseup', stop);
		event_connect(widget.document, 'mouseleave', stop);
		event_stop(event);
	};
	
	// Resize top left:
	var action_top_left = function(event) {
		var stop = function() {
			widget.overlay.setAttribute('state', '');
			widget.selection.setAttribute('state', '');
			
			event_release(widget.selection, 'mousemove', move)
			event_release(widget.selection, 'mouseup', stop);
			event_release(widget.overlay, 'mousemove', move)
			event_release(widget.overlay, 'mouseup', stop);
			event_release(widget.document, 'mouseleave', stop);
		};
		var move = function(event) {
			widget.overlay.setAttribute('state', 'resize-top-left');
			widget.selection.setAttribute('state', 'resize-top-left');
			
			set_selection_top(event, context_top);
			set_selection_left(event, context_left);
		};
		
		var context_top = init_selection_top(event);
		var context_left = init_selection_left(event);
		
		action_maximize_state = null;
		
		event_connect(widget.selection, 'mousemove', move)
		event_connect(widget.selection, 'mouseup', stop);
		event_connect(widget.overlay, 'mousemove', move)
		event_connect(widget.overlay, 'mouseup', stop);
		event_connect(widget.document, 'mouseleave', stop);
		event_stop(event);
	};
	
	// Resize top right:
	var action_top_right = function(event) {
		var stop = function() {
			widget.overlay.setAttribute('state', '');
			widget.selection.setAttribute('state', '');
			
			event_release(widget.selection, 'mousemove', move)
			event_release(widget.selection, 'mouseup', stop);
			event_release(widget.overlay, 'mousemove', move)
			event_release(widget.overlay, 'mouseup', stop);
			event_release(widget.document, 'mouseleave', stop);
		};
		var move = function(event) {
			widget.overlay.setAttribute('state', 'resize-top-right');
			widget.selection.setAttribute('state', 'resize-top-right');
			
			set_selection_top(event, context_top);
			set_selection_right(event, context_right);
		};
		
		var context_top = init_selection_top(event);
		var context_right = init_selection_right(event);
		
		action_maximize_state = null;
		
		event_connect(widget.selection, 'mousemove', move)
		event_connect(widget.selection, 'mouseup', stop);
		event_connect(widget.overlay, 'mousemove', move)
		event_connect(widget.overlay, 'mouseup', stop);
		event_connect(widget.document, 'mouseleave', stop);
		event_stop(event);
	};
	
	// Resize bottom:
	var action_bottom = function(event) {
		var stop = function() {
			widget.overlay.setAttribute('state', '');
			widget.selection.setAttribute('state', '');
			
			event_release(widget.selection, 'mousemove', move)
			event_release(widget.selection, 'mouseup', stop);
			event_release(widget.overlay, 'mousemove', move)
			event_release(widget.overlay, 'mouseup', stop);
			event_release(widget.document, 'mouseleave', stop);
		};
		var move = function(event) {
			widget.overlay.setAttribute('state', 'resize-bottom');
			widget.selection.setAttribute('state', 'resize-bottom');
			
			set_selection_bottom(event, context_bottom);
		};
		
		var context_bottom = init_selection_bottom(event);
		
		action_maximize_state = null;
		
		event_connect(widget.selection, 'mousemove', move)
		event_connect(widget.selection, 'mouseup', stop);
		event_connect(widget.overlay, 'mousemove', move)
		event_connect(widget.overlay, 'mouseup', stop);
		event_connect(widget.document, 'mouseleave', stop);
		event_stop(event);
	};
	
	// Resize bottom left:
	var action_bottom_left = function(event) {
		var stop = function() {
			widget.overlay.setAttribute('state', '');
			widget.selection.setAttribute('state', '');
			
			event_release(widget.selection, 'mousemove', move)
			event_release(widget.selection, 'mouseup', stop);
			event_release(widget.overlay, 'mousemove', move)
			event_release(widget.overlay, 'mouseup', stop);
			event_release(widget.document, 'mouseleave', stop);
		};
		var move = function(event) {
			widget.overlay.setAttribute('state', 'resize-bottom-left');
			widget.selection.setAttribute('state', 'resize-bottom-left');
			
			set_selection_bottom(event, context_bottom);
			set_selection_left(event, context_left);
		};
		
		var context_bottom = init_selection_bottom(event);
		var context_left = init_selection_left(event);
		
		action_maximize_state = null;
		
		event_connect(widget.selection, 'mousemove', move)
		event_connect(widget.selection, 'mouseup', stop);
		event_connect(widget.overlay, 'mousemove', move)
		event_connect(widget.overlay, 'mouseup', stop);
		event_connect(widget.document, 'mouseleave', stop);
		event_stop(event);
	};
	
	// Resize bottom right:
	var action_bottom_right = function(event) {
		var stop = function() {
			widget.overlay.setAttribute('state', '');
			widget.selection.setAttribute('state', '');
			
			event_release(widget.selection, 'mousemove', move)
			event_release(widget.selection, 'mouseup', stop);
			event_release(widget.overlay, 'mousemove', move)
			event_release(widget.overlay, 'mouseup', stop);
			event_release(widget.document, 'mouseleave', stop);
		};
		var move = function(event) {
			widget.overlay.setAttribute('state', 'resize-bottom-right');
			widget.selection.setAttribute('state', 'resize-bottom-right');
			
			set_selection_bottom(event, context_bottom);
			set_selection_right(event, context_right);
		};
		
		var context_bottom = init_selection_bottom(event);
		var context_right = init_selection_right(event);
		
		action_maximize_state = null;
		
		event_connect(widget.selection, 'mousemove', move)
		event_connect(widget.selection, 'mouseup', stop);
		event_connect(widget.overlay, 'mousemove', move)
		event_connect(widget.overlay, 'mouseup', stop);
		event_connect(widget.document, 'mouseleave', stop);
		event_stop(event);
	};
	
	// Resize left:
	var action_left = function(event) {
		var stop = function() {
			widget.overlay.setAttribute('state', '');
			widget.selection.setAttribute('state', '');
			
			event_release(widget.selection, 'mousemove', move)
			event_release(widget.selection, 'mouseup', stop);
			event_release(widget.overlay, 'mousemove', move)
			event_release(widget.overlay, 'mouseup', stop);
			event_release(widget.document, 'mouseleave', stop);
		};
		var move = function(event) {
			widget.overlay.setAttribute('state', 'resize-left');
			widget.selection.setAttribute('state', 'resize-left');
			
			set_selection_left(event, context_left);
		};
		
		var context_left = init_selection_left(event);
		
		action_maximize_state = null;
		
		event_connect(widget.selection, 'mousemove', move)
		event_connect(widget.selection, 'mouseup', stop);
		event_connect(widget.overlay, 'mousemove', move)
		event_connect(widget.overlay, 'mouseup', stop);
		event_connect(widget.document, 'mouseleave', stop);
		event_stop(event);
	};
	
	// Resize right:
	var action_right = function(event) {
		var stop = function() {
			widget.overlay.setAttribute('state', '');
			widget.selection.setAttribute('state', '');
			
			event_release(widget.selection, 'mousemove', move)
			event_release(widget.selection, 'mouseup', stop);
			event_release(widget.overlay, 'mousemove', move)
			event_release(widget.overlay, 'mouseup', stop);
			event_release(widget.document, 'mouseleave', stop);
		};
		var move = function(event) {
			widget.overlay.setAttribute('state', 'resize-right');
			widget.selection.setAttribute('state', 'resize-right');
			
			set_selection_right(event, context_right);
		};
		
		var context_right = init_selection_right(event);
		
		action_maximize_state = null;
		
		event_connect(widget.selection, 'mousemove', move)
		event_connect(widget.selection, 'mouseup', stop);
		event_connect(widget.overlay, 'mousemove', move)
		event_connect(widget.overlay, 'mouseup', stop);
		event_connect(widget.document, 'mouseleave', stop);
		event_stop(event);
	};
	
	// Select:
	var action_all = function(event) {
		var stop = function() {
			widget.overlay.setAttribute('state', '');
			widget.selection.setAttribute('state', '');
			
			event_release(widget.selection, 'mousemove', move)
			event_release(widget.selection, 'mouseup', stop);
			event_release(widget.overlay, 'mousemove', move)
			event_release(widget.overlay, 'mouseup', stop);
			event_release(widget.document, 'mouseleave', stop);
		};
		var move = function(event) {
			widget.overlay.setAttribute('state', 'selecting');
			widget.selection.setAttribute('state', 'selecting');
			
			if (start.x < event.pageX) {
				var width = event.pageX - start.x;
				var left = start.x;
			}
			
			else {
				var width = start.x - event.pageX;
				var left = event.pageX;
			}
			
			if (start.y < event.pageY) {
				var height = event.pageY - start.y;
				var top = start.y;
			}
			
			else {
				var height = start.y - event.pageY;
				var top = event.pageY;
			}
			
			if (width < 4) width = 4;
			if (height < 4) height = 4;
			
			scroll_to_y(event.pageY, event.pageY);
			scroll_to_x(event.pageX, event.pageX);
			
			widget.selection.style.top = top + 'px';
			widget.selection.style.left = left + 'px';
			widget.selection.style.width = width + 'px';
			widget.selection.style.height = height + 'px';
		};
		
		var start = {
			x:	event.pageX,
			y:	event.pageY
		};
		
		action_maximize_state = null;
		
		event_connect(widget.selection, 'mousemove', move)
		event_connect(widget.selection, 'mouseup', stop);
		event_connect(widget.overlay, 'mousemove', move)
		event_connect(widget.overlay, 'mouseup', stop);
		event_connect(widget.document, 'mouseleave', stop);
		event_stop(event);
	};
	
	// Define widgets:
	widget.document = window.top.getBrowser().selectedBrowser.contentWindow.document;
	widget.window = widget.document.defaultView;
	widget.root = widget.document.documentElement;
	widget.overlay = widget.document.createElement('abduction-overlay');
	widget.selection = widget.document.createElement('abduction-selection');
	widget.selection_inner = widget.document.createElement('abduction-selection-inner');
	widget.selection_top = widget.document.createElement('abduction-selection-top');
	widget.selection_top_left = widget.document.createElement('abduction-selection-top-left');
	widget.selection_top_right = widget.document.createElement('abduction-selection-top-right');
	widget.selection_bottom = widget.document.createElement('abduction-selection-bottom');
	widget.selection_bottom_left = widget.document.createElement('abduction-selection-bottom-left');
	widget.selection_bottom_right = widget.document.createElement('abduction-selection-bottom-right');
	widget.selection_left = widget.document.createElement('abduction-selection-left');
	widget.selection_right = widget.document.createElement('abduction-selection-right');
	
	var styles = widget.document.createElement('link');
	styles.setAttribute('rel', 'stylesheet');
	styles.setAttribute('href', 'resource://abduction/browser.css');
	widget.root.appendChild(styles);
	widget.root.appendChild(widget.overlay);
	
	if (target) {
		var target_position = get_position(target);
		
		if (target_position.height < setting.min_height) {
			target_position.height = setting.min_height;
		}
		
		if (target_position.width < setting.min_width) {
			target_position.width = setting.min_width;
		}
		
		widget.selection.style.height = target_position.height + 'px';
		widget.selection.style.left = target_position.left + 'px';
		widget.selection.style.top = target_position.top + 'px';
		widget.selection.style.width = target_position.width + 'px';
	}
	
	else {
		widget.selection.style.height = (widget.window.innerHeight * 0.33) + 'px';
		widget.selection.style.left = (widget.window.innerWidth * 0.33) + 'px';
		widget.selection.style.top = (widget.root.scrollTop + (widget.window.innerHeight * 0.33)) + 'px';
		widget.selection.style.width = (widget.window.innerWidth * 0.33) + 'px';
	}
	
	widget.root.appendChild(widget.selection);
	widget.selection.appendChild(widget.selection_inner);
	widget.selection_inner.appendChild(widget.selection_top);
	widget.selection_inner.appendChild(widget.selection_top_left);
	widget.selection_inner.appendChild(widget.selection_top_right);
	widget.selection_inner.appendChild(widget.selection_bottom);
	widget.selection_inner.appendChild(widget.selection_bottom_left);
	widget.selection_inner.appendChild(widget.selection_bottom_right);
	widget.selection_inner.appendChild(widget.selection_left);
	widget.selection_inner.appendChild(widget.selection_right);
	
	widget.overlay.setAttribute('state', '');
	widget.selection.setAttribute('state', '');
	
	// Bind actions:
	event_connect(widget.overlay, 'mousedown', action_all);
	event_connect(widget.selection, 'mousedown', action_move);
	event_connect(widget.selection, 'dblclick', action_maximize);
	event_connect(widget.selection_top, 'mousedown', action_top);
	event_connect(widget.selection_top_left, 'mousedown', action_top_left);
	event_connect(widget.selection_top_right, 'mousedown', action_top_right);
	event_connect(widget.selection_bottom, 'mousedown', action_bottom);
	event_connect(widget.selection_bottom_left, 'mousedown', action_bottom_left);
	event_connect(widget.selection_bottom_right, 'mousedown', action_bottom_right);
	event_connect(widget.selection_left, 'mousedown', action_left);
	event_connect(widget.selection_right, 'mousedown', action_right);
	
	/*-------------------------------------------------------------------------------------------*/

	var capture = function() {
		var canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'html:canvas');
		var context = canvas.getContext('2d');
		var selection = get_position(widget.selection);
		
		canvas.height = selection.height;
		canvas.width = selection.width;
		
		widget.overlay.style.display = 'none';
		widget.selection.style.display = 'none';
		
		context.drawWindow(
			widget.window,
			selection.left,
			selection.top,
			selection.width,
			selection.height,
			'rgb(255, 255, 255)'
		);
		
		widget.overlay.style.display = 'block';
		widget.selection.style.display = 'block';
		
		return canvas.toDataURL();
	};
	var action_close = function(event) {
		event_release(notice, 'command', action_close);
		event_release(widget.window, 'unload', action_close);
		event_release(widget.window, 'keydown', action_keydown);
		
		widget.root.removeChild(styles);
		widget.root.removeChild(widget.overlay);
		widget.root.removeChild(widget.selection);
		notices.removeAllNotifications(true);
	};
	var action_save = function(event) {
		internalSave(
			capture(), null, filename + '.png', null,
			'image/png', true, null, null, null, false
		);
		action_close();
	};
	var action_keydown = function(event) {
		if (event.keyCode == 27) action_close();
		else if (event.keyCode == 13) action_save();
		else return;
		
		event_release(widget.window, 'keydown', action_keydown);
	};
	var append_notice = function() {
		return notices.appendNotification(
			label.notice + ' ' + filename, 'abduction-controls',
			null, notices.PRIORITY_INFO_HIGH, [
				{
					label:		label.selectall,
					callback:	function() {
						notice_allow_close = false;
						action_maximize();
					}
				},
				{
					label:		label.save,
					accessKey:	label.accesskey,
					callback:	function() {
						notice_allow_close = false;
						action_save();
					}
				}
			]
		);
	};
	
	var notices = window.getNotificationBox(widget.window);
	var filename = (widget.document.title ? widget.document.title : widget.document.URL);
	var notice = append_notice();
	var notice_allow_close = true;
	
	event_connect(notice, 'command', function() {
		if (notice_allow_close) action_close();
		
		notice_allow_close = true;
	});
	event_connect(widget.window, 'unload', action_close);
	event_connect(widget.window, 'keydown', action_keydown);
};
