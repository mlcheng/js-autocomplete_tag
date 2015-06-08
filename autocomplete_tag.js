/***********************************************

  "autocomplete_tag.js"

  Created by Michael Cheng on 06/03/2015 20:10
            http://michaelcheng.us/
            michael@michaelcheng.us
            --All Rights Reserved--

***********************************************/

"use strict";

var iqwerty = iqwerty || {};

iqwerty.autocomplete = (function() {

	/**
	 * The Autocomplete object.
	 * @param {String} target  This is the target to bind the Autocomplete to. This should be the ID of an element
	 * @param {Array}  data    An array of data that will be the search suggestions
	 * @param {Object} options The options for the Autocomplete. Details below
	 */
	function Autocomplete(target, options) {

		/**
		 * The default options for the Autocomplete.
		 * You can override these settings by passing in an options object when building the Autocomplete, or by using setter methods after building.
		 * @type {Object}
		 */
		var _options = {
			/**
			 * The search suggestions. This should be a text array
			 * @type {Array}
			 */
			searchSuggestionAuthority: null,

			settings: {
				/**
				 * The minimum amount of characters needed to begin finding a suggestion
				 * @type {Number}
				 */
				inputThreshold: 2,
			},

			eventListeners: {
				/**
				 * Called when the user types something
				 * @type {Function}
				 */
				onInputChangedListener: null,

				/**
				 * Called when tags are added or removed
				 * @type {Function}
				 */
				onTagChangedListener: null
			}
		};
		this.getOptions = function() {
			return _options;
		};
		/**
		 * Takes an options object and merges it with the current options. After merging, the new options become the current.
		 * @param {Object} options The object containing the options.
		 */
		this.setOptions = function(options) {
			if(options != undefined) {
				_options = (function mergeOptions(initial, custom) {
					var merged = custom;
					for(var prop in initial) {
						if(merged.hasOwnProperty(prop)) {
							if(initial[prop] != null && initial[prop].constructor == Object) {
								merged[prop] = mergeOptions(initial[prop], merged[prop]);
							}
						} else {
							merged[prop] = initial[prop];
						}
					}
					return merged;
				})(_options, options);
			}
			options = _options;
		};

		/**
		 * The Autocomplete wrapper
		 * @type {Element}
		 */
		var _autocompleteStage = null;
		this.getAutocompleteStage = function() {
			return _autocompleteStage;
		};
		function setAutocompleteStage(autocompleteStage) {
			_autocompleteStage = autocompleteStage;
		};

		/**
		 * The element where text is entered
		 * @type {Element}
		 */
		var _inputStage = null;
		this.getInputStage = function() {
			return _inputStage;
		};
		function setInputStage(inputStage) {
			_inputStage = inputStage;
		};

		/**
		 * The element where tags are added
		 * @type {Element}
		 */
		var _tagStage = null;
		this.getTagStage = function() {
			return _tagStage;
		};
		function setTagStage(tagStage) {
			_tagStage = tagStage;
		};

		/**
		 * The element where suggestions are listed
		 * @type {Element}
		 */
		var _suggestionsStage = null;
		this.getSuggestionsStage = function() {
			return _suggestionsStage;
		};
		function setSuggestionsStage(suggestionsStage) {
			_suggestionsStage = suggestionsStage;
		};


		/**
		 * Apply changes to the Autocomplete object after options are changed
		 *
		 * Status: Incomplete
		 */
		this.apply = function() {
			if(this.getOptions().eventListeners.onInputChangedListener != null) {
				this.getInputStage().addEventListener("input", function() {
					this.getOptions().eventListeners.onInputChangedListener(stripTags(this.getInputStage().innerHTML));
				}.bind(this));
			}
		};


		/**
		 * Self-executing initialization function.
		 * This initializes the Autocomplete and sets up the stages
		 */
		(function init() {
			this.setOptions(options);

			/**
			 * Bind the Autocomplete to the DOM target.
			 * Also initialize all the stages needed
			 * @param  {Element} target Passed in by the Autocomplete constructor
			 */
			(function bindTarget(target) {
				var autocompleteStage = document.getElementById(target);
				if(autocompleteStage == null) {
					console.log("Target doesn't exist.");
					return;
				}

				this.stylize(autocompleteStage, STYLE_AUTOCOMPLETE);
				setAutocompleteStage(autocompleteStage);


				// create the tagStage
				var tagStage = document.createElement("div");
				setTagStage(tagStage);


				// create inputWrapper
				var inputWrapper = document.createElement("div");
				this.stylize(inputWrapper, STYLE_AUTOCOMPLETE_EDITOR_WRAPPER);


				// create the inputStage
				var inputStage = document.createElement("div");
				inputStage.classList.add(CLASS_AUTOCOMPLETE_EDITOR);
				this.stylize(inputStage, STYLE_AUTOCOMPLETE_EDITOR);

				inputStage.contentEditable = true;
				inputStage.addEventListener("input", function() {
					this.showSuggestions(stripTags(this.getInputStage().innerHTML));
				}.bind(this));
				setInputStage(inputStage);


				// create the suggestionsStage
				var suggestionsStage = document.createElement("div");
				suggestionsStage.classList.add(CLASS_HIDDEN);
				this.stylize(suggestionsStage, STYLE_SUGGESTIONS_PANEL);
				var suggestionsList = document.createElement("ul");
				this.stylize(suggestionsList, STYLE_SUGGESTIONS_UL);
				suggestionsStage.appendChild(suggestionsList);
				setSuggestionsStage(suggestionsStage);

				inputWrapper.appendChild(inputStage);
				inputWrapper.appendChild(suggestionsStage);



				// append the child stages to the target
				autocompleteStage.appendChild(tagStage);
				autocompleteStage.appendChild(inputWrapper);




				autocompleteStage = null;
				tagStage = null;
				inputWrapper = null;
				inputStage = null;
				suggestionsStage = null;
				suggestionsList = null;


				this.focus();
			}.bind(this))(target);



			//this.apply();
			this.injectStyles();
		}.bind(this))();

	};

	/**
	 * Specifies whether or not the inline stylesheet has been injected into the document head already.
	 * @type {Boolean}
	 */
	Autocomplete.prototype.styleInjected = false;

	/**
	 * Injects styles that cannot be inline the element attributes (e.g. :selectors) into the document head.
	 */
	Autocomplete.prototype.injectStyles = function() {
		if(!Autocomplete.prototype.styleInjected) { //custom style not in head yet
			var style = document.createElement("style");

			style.insertAdjacentHTML("beforeend", Autocomplete.prototype.injectStyle(CLASS_SUGGESTIONS_LI, STYLE_SUGGESTIONS_LI_HOVER, ":hover"));

			style.insertAdjacentHTML("beforeend", Autocomplete.prototype.injectStyle(CLASS_HIDDEN, STYLE_HIDDEN));

			style.insertAdjacentHTML("beforeend", Autocomplete.prototype.injectStyle(CLASS_TAG, STYLE_TAG_AFTER, ":after"));

			style.insertAdjacentHTML("beforeend", Autocomplete.prototype.injectStyle(CLASS_AUTOCOMPLETE_EDITOR, STYLE_AUTOCOMPLETE_EDITOR_BEFORE, ":before"));

			document.head.appendChild(style);
			style = null;
			Autocomplete.prototype.styleInjected = true;
		}
	};

	/**
	 * Inject a style into the inline stylesheet
	 * @param  {String} identifier The class of the element
	 * @param  {Object} style      An object containing the style, e.g. {"background": "pink"}
	 * @param  {String} selector   An optional string specifying a CSS selector, e.g. ":focus"
	 * @return {String}            The style HTML
	 */
	Autocomplete.prototype.injectStyle = function(identifier, style, selector) {
		var out = "." + identifier + ((selector != undefined) ? selector : "") + " {";
		Object.keys(style).forEach(function(value, index, array) {
			out += value + ": " + style[value] + ";";
		});
		out += "}";
		return out;
	};

	/**
	 * Calls focus to the user input box
	 */
	Autocomplete.prototype.focus = function() {
		this.getInputStage().focus();
	};

	/**
	 * Stylize an element with a specified style. The style is inserted inline
	 * @param  {Element} elem  The element to style
	 * @param  {Object}  style An object containing the style, e.g. {"color": "red"}
	 */
	Autocomplete.prototype.stylize = function(elem, style) {
		Object.keys(style).forEach(function(value, index, array) {
			elem.style[value] = style[value];
		});
	};

	/**
	 * Sets the search suggestions data source
	 * @param {Array} searchSuggestionAuthority An array containing the suggestion data
	 */
	Autocomplete.prototype.setSearchSuggestionAuthority = function(searchSuggestionAuthority) {
		this.setOptions({searchSuggestionAuthority: searchSuggestionAuthority});
		//this.apply();
	};

	/**
	 * Sets the minimum amount of characters needed to trigger suggestions
	 * @param {Number} inputThreshold The minimum amount of characters needed to trigger suggestions
	 */
	Autocomplete.prototype.setInputThreshold = function(inputThreshold) {
		this.setOptions({settings: {inputThreshold: inputThreshold}});
		this.apply();
	};

	/**
	 * Sets the inputChanged callback
	 * @param {Function} onInputChangedListener The callback to call when the input changes
	 */
	Autocomplete.prototype.setOnInputChangedListener = function(onInputChangedListener) {
		this.setOptions({eventListeners: {onInputChangedListener: onInputChangedListener}});
		this.apply();
	};

	/**
	 * Sets the tagChanged callback
	 * @param {Function} onTagChangedListener The callback to call when the tags change
	 */
	Autocomplete.prototype.setOnTagChangedListener = function(onTagChangedListener) {
		this.setOptions({eventListeners: {onTagChangedListener: onTagChangedListener}});
		this.apply();
	};

	/**
	 * Find the suggestions for the specified search query
	 * @param  {String} search The query to find suggestions for, e.g. "ap"
	 * @return {Array}         Returns an array containing the suggestions for the query, e.g. ["app", "apple"]
	 */
	Autocomplete.prototype.findSuggestions = function(search) {
		return this.getOptions().searchSuggestionAuthority.filter(function(obj) {
			if(obj.toLowerCase().indexOf(search.toLowerCase()) == 0) {
				return obj;
			}
		});
	};

	/**
	 * Shows the suggestions in the suggestionsStage
	 * @param  {String} search The search query
	 */
	Autocomplete.prototype.showSuggestions = function(search) {
		if(search == "") {
			this.hideSuggestions();
			return;
		}


		this.getSuggestionsStage().classList.remove(CLASS_HIDDEN);


		var results = this.findSuggestions(search);
		var suggestions = document.createDocumentFragment();
		var suggestionsList = this.getSuggestionsStage().querySelector("ul");


		while(suggestionsList.firstChild != null) {
			suggestionsList.removeChild(suggestionsList.firstChild);
		}



		results.forEach(function(value, index, array) {
			var li = document.createElement("li");
			Autocomplete.prototype.stylize(li, STYLE_SUGGESTIONS_LI);

			li.classList.add(CLASS_SUGGESTIONS_LI);
			li.addEventListener("click", function() {
				this.addTag(value);
			}.bind(this));

			li.appendChild(document.createTextNode(value));
			suggestions.appendChild(li);
		}.bind(this));

		suggestionsList.appendChild(suggestions);
		this.getSuggestionsStage().appendChild(suggestionsList);

		results = null;
		suggestions = null;
		suggestionsList = null;
	};

	/**
	 * Hide the suggestions
	 */
	Autocomplete.prototype.hideSuggestions = function() {
		this.getSuggestionsStage().classList.add(CLASS_HIDDEN);
	};

	/**
	 * Add a tag to the tagStage
	 * @param {String} text The text for the tag
	 */
	Autocomplete.prototype.addTag = function(text) {
		var tag = document.createElement("span");
		tag.classList.add(CLASS_TAG);

		this.stylize(tag, STYLE_TAG);

		var autocomplete = this;
		tag.addEventListener("click", function() {
			autocomplete.removeTag(this);
			autocomplete = null;
		});
		tag.appendChild(document.createTextNode(text));
		this.getTagStage().appendChild(tag);



		this.clearInput();
		this.hideSuggestions();
		this.focus();

		tag = null;
	};

	/**
	 * Remove the specified tag from the tagStage and focuses on the input
	 * @param  {Element} tag The tag to remove
	 */
	Autocomplete.prototype.removeTag = function(tag) {
		this.getTagStage().removeChild(tag);
		tag = null;

		this.focus();
	};

	/**
	 * Clears the user input
	 */
	Autocomplete.prototype.clearInput = function() {
		this.getInputStage().removeChild(this.getInputStage().firstChild);
	};


	/**
	 * Strip HTML tags from the input
	 * @param  {String} input The tag to be stripped
	 * @return {String}       The input with HTML tags stripped
	 */
	function stripTags(input) {
		return input.replace(/(<([^>]+)>)/ig, "");
	};


	var CLASS_HIDDEN = "iqwerty_autocomplete_hidden";
	var CLASS_AUTOCOMPLETE_EDITOR = "iqwerty_autocomplete_editor";
	var CLASS_SUGGESTIONS_LI = "iqwerty_autocomplete_suggestions_li";
	var CLASS_TAG = "iqwerty_autocomplete_tag";

	var STYLE_AUTOCOMPLETE = {
		"display": "flex",
		"flex-flow": "row",
		"align-items": "center",
		"background": "white",
		"border": "1px solid rgba(0, 0, 0, .4)",
		"border-radius": "3px",
		"height": "2em"
	};

	var STYLE_AUTOCOMPLETE_EDITOR = {
		"outline": "none",
		"overflow": "hidden"
	};

	/**
	 * This is a hack for getting some content into the input so the height is correct.
	 * Without this, the height is 0 and the input is not clickable.
	 * @type {Object}
	 */
	var STYLE_AUTOCOMPLETE_EDITOR_BEFORE = {
		"content": "\"\\feff \""
	};

	var STYLE_AUTOCOMPLETE_EDITOR_WRAPPER = {
		"position": "relative",
		"flex": "1"
	}

	var STYLE_SUGGESTIONS_PANEL = {
		"position": "absolute",
		"background": "white",
		"z-index": "9999",
		"top": "2em",
		"box-shadow": "0 0 5px rgba(0, 0, 0, .25)",
	};

	var STYLE_SUGGESTIONS_UL = {
		"list-style": "none",
		"padding": "0",
		"margin": "0"
	};

	var STYLE_SUGGESTIONS_LI = {
		"margin": "5px",
		"padding": "5px",
		"transition": "background 300ms"
	};

	var STYLE_SUGGESTIONS_LI_HOVER = {
		"background": "rgba(0, 0, 0, .02)",
		"cursor": "pointer"
	};

	var STYLE_TAG = {
		"background": "rgba(0, 0, 0, .05)",
		"margin": "0 5px",
		"padding": "0 5px",
		"border": "1px solid rgba(0, 0, 0, .1)",
		"cursor": "pointer"
	};

	var STYLE_TAG_AFTER = {
		"content": "\" ✕\""
	};

	var STYLE_HIDDEN = {
		"display": "none"
	}

	return {
		Autocomplete: Autocomplete
	};
})();