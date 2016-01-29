function compare_methods(a, b)
{
	if (a == "chrome" && b != "chrome") {
		return -1;
	}

	if (a != "chrome" && b == "chrome") {
		return 1;
	}

	return 0;
}

function compare_domains(a, b)
{
	var aparts;
	var bparts;

	aparts = a.split(".").reverse();
	bparts = b.split(".").reverse();

	while (aparts.length && bparts.length) {
		if (bparts.length && !aparts.length) {
			return -1;
		}

		if (aparts.length && !bparts.length) {
			return 1;
		}

		if (aparts[0] < bparts[0]) {
			return -1;
		}

		if (aparts[0] > bparts[0]) {
			return 1;
		}

		aparts.shift();
		bparts.shift();
	}

	return 0;
}

function compare_urls(a, b)
{
	/* 1: access method (chrome: vs http/https) */
	/* 2: domain name */
	/* 3: rest of url */

	var i;
	var c;

	var aprefix;
	var bprefix;

	var asuffix;
	var bsuffix;

	asuffix = a.url;
	bsuffix = b.url;

	/* check access method */
	i = asuffix.indexOf("://");

	if (i == -1) {
		console.log("URL " + a.url + " is missing access method");
		aprefix = "http";
	} else {
		aprefix = asuffix.substr(0, i);
		asuffix = asuffix.substr(i + 3)
	}

	i = bsuffix.indexOf("://");

	if (i == -1) {
		console.log("URL " + b.url + " is missing access method");
		bprefix = "http";
	} else {
		bprefix = bsuffix.substr(0, i);
		bsuffix = bsuffix.substr(i + 3);
	}

	c = compare_methods(aprefix, bprefix);

	if (c != 0) {
		return c;
	}

	/* check domain */

	i = asuffix.indexOf("/");

	if (i == -1) {
		aprefix = asuffix;
		asuffix = "";
	} else {
		aprefix = asuffix.substr(0, i);
		asuffix = asuffix.substr(i);
	}

	i = bsuffix.indexOf("/");

	if (i == -1) {
		bprefix = bsuffix;
		bsuffix = "";
	} else {
		bprefix = bsuffix.substr(0, i);
		bsuffix = bsuffix.substr(i);
	}

	c = compare_domains(aprefix, bprefix);

	if (c != 0) {
		return c;
	}

	/* compare the rest of the url */

	if (asuffix < bsuffix) {
		return -1;
	}

	if (asuffix > bsuffix) {
		return 1;
	}

	return 0;
}

function compare_titles(a, b)
{
	if (a.title < b.title) {
		return -1;
	}

	if (a.title > b.title) {
		return 1;
	}

	return 0;
}

function compare_types(a, b)
{
	var af, bf;

	af = !(a.children == undefined);
	bf = !(b.children == undefined);

	if (af && !bf) {
		return -1;
	}

	if (!af && bf) {
		return 1;
	}

	return 0;
}

function compare_bookmarks(a, b)
{
	var c;

	c = compare_types(a, b);
	
	if (c != 0) {
		return c;
	}

	if (a.children == undefined) {
		c = compare_urls(a, b);
	} else {
		c = compare_titles(a, b);
	}

	if (c) {
		return c;
	}

	/* if they're identical, sort them by where they're already at */
	return (a.index - b.index);
}

function sort_folder(bookmark)
{
	var i;
	var sz;

	var pid;
	var children;

	pid = bookmark.id;
	children = bookmark.children;

	sz = children.length;

	children.sort(compare_bookmarks);

	for (i = 0; i < sz; i++) {
		var bookmark;
		
		bookmark = children[i];

		if (bookmark.children != undefined) {
			sort_folder(bookmark);
		}

		chrome.bookmarks.move(bookmark.id, {"parentId": pid, "index": i});
	}
}

function sort_root(bookmarks)
{
	var i;
	var sz;

	bookmarks = bookmarks[0].children;

	sz = bookmarks.length;

	for (i = 0; i < sz; i++) {
		sort_folder(bookmarks[i]);
	}
}

function sort_bookmarks(tab)
{
	chrome.bookmarks.getTree(sort_root);
}

chrome.browserAction.onClicked.addListener(sort_bookmarks);
