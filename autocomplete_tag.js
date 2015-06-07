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

	function Autocomplete(target, data, options) {
		var _options = {
			searchSuggestionAuthority: null,
			settings: {
				inputThreshold: 2,
			},
			eventListeners: {
				onInputChangedListener: null,
				onTagChangedListener: null
			}
		};
		this.getOptions = function() {
			return _options;
		};
		this.setOptions = function(options) {
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
			options = _options;
		};

		var _autocompleteStage = null;
		this.getAutocompleteStage = function() {
			return _autocompleteStage;
		};
		function setAutocompleteStage(autocompleteStage) {
			_autocompleteStage = autocompleteStage;
		};

		var _inputStage = null;
		this.getInputStage = function() {
			return _inputStage;
		};
		function setInputStage(inputStage) {
			_inputStage = inputStage;
		};

		var _tagStage = null;
		this.getTagStage = function() {
			return _tagStage;
		};
		function setTagStage(tagStage) {
			_tagStage = tagStage;
		};

		var _suggestionsStage = null;
		this.getSuggestionsStage = function() {
			return _suggestionsStage;
		};
		function setSuggestionsStage(suggestionsStage) {
			_suggestionsStage = suggestionsStage;
		};


		this.apply = function() {
			if(this.getOptions().eventListeners.onInputChangedListener != null) {
				this.getInputStage().addEventListener("input", function() {
					this.getOptions().eventListeners.onInputChangedListener(stripTags(this.getInputStage().innerHTML));

					this.showSuggestions(stripTags(this.getInputStage().innerHTML));
				}.bind(this));
			}
		};



		(function init() {
			this.setOptions(options);
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
				this.stylize(inputStage, STYLE_AUTOCOMPLETE_EDITOR);
				inputStage.contentEditable = true;
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

			this.apply();
			this.injectStyles();
		}.bind(this))();

	};


	Autocomplete.prototype.styleInjected = false;

	Autocomplete.prototype.injectStyles = function() {
		if(!Autocomplete.prototype.styleInjected) {
			var style = document.createElement("style");

			style.insertAdjacentHTML("beforeend", Autocomplete.prototype.injectStyle(CLASS_SUGGESTIONS_LI, STYLE_SUGGESTIONS_LI_HOVER, ":hover"));
			style.insertAdjacentHTML("beforeend", Autocomplete.prototype.injectStyle(CLASS_HIDDEN, STYLE_HIDDEN));
			style.insertAdjacentHTML("beforeend", Autocomplete.prototype.injectStyle(CLASS_TAG, STYLE_TAG_AFTER, ":after"));

			document.head.appendChild(style);
			style = null;
			Autocomplete.prototype.styleInjected = true;
		}
	};

	Autocomplete.prototype.injectStyle = function(identifier, style, selector) {
		var out = "." + identifier + ((selector != undefined) ? selector : "") + " {";
		Object.keys(style).forEach(function(value, index, array) {
			out += value + ": " + style[value] + ";";
		});
		out += "}";
		return out;
	};


	Autocomplete.prototype.focus = function() {
		this.getInputStage().focus();
	};

	Autocomplete.prototype.stylize = function(elem, style) {
		Object.keys(style).forEach(function(value, index, array) {
			elem.style[value] = style[value];
		});
	};

	Autocomplete.prototype.setSearchSuggestionAuthority = function(searchSuggestionAuthority) {
		this.setOptions({searchSuggestionAuthority: searchSuggestionAuthority});
		this.apply();
	};

	Autocomplete.prototype.setInputThreshold = function(inputThreshold) {
		this.setOptions({settings: {inputThreshold: inputThreshold}});
		this.apply();
	};

	Autocomplete.prototype.setOnInputChangedListener = function(onInputChangedListener) {
		this.setOptions({eventListeners: {onInputChangedListener: onInputChangedListener}});
		this.apply();
	};

	Autocomplete.prototype.setOnTagChangedListener = function(onTagChangedListener) {
		this.setOptions({eventListeners: {onTagChangedListener: onTagChangedListener}});
		this.apply();
	};

	Autocomplete.prototype.findSuggestions = function(search) {
		return this.getOptions().searchSuggestionAuthority.filter(function(obj) {
			if(obj.toLowerCase().indexOf(search.toLowerCase()) == 0) {
				return obj;
			}
		});
	};

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

	Autocomplete.prototype.hideSuggestions = function() {
		this.getSuggestionsStage().classList.add(CLASS_HIDDEN);
	};

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

	Autocomplete.prototype.removeTag = function(tag) {
		this.getTagStage().removeChild(tag);
		tag = null;

		this.focus();
	};

	Autocomplete.prototype.clearInput = function() {
		this.getInputStage().removeChild(this.getInputStage().firstChild);
	};


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
		"border": "1px solid black",
		"border-radius": "3px",
		"height": "2em"
	};

	var STYLE_AUTOCOMPLETE_EDITOR = {
		"height": "2em",
		"outline": "none"
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