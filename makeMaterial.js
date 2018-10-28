var fs = require('fs');
var cheerio = require("cheerio");
var svg2ttf = require('svg2ttf');
var SVGIcons2SVGFontStream = require('svgicons2svgfont');

var assetDir = "./res/material"

// unfortunately you have to run these one at a time cause i wrote this really async like a dummy

var styleName = "Baseline"
// var styleName = "Outline"
// var styleName = "Round"
// var styleName = "Sharp"


String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

var json = {
	resourceDir: assetDir + "/" + styleName,
	binDir: "./bin/" + styleName,
	fontName: "Material Icons",
	fontId: "Material-Icons-" + styleName.capitalize(),
	fontFileName: "Material-Icons-" + styleName.capitalize(),
	fontStyle: styleName.capitalize(),
	fontBoxSize: 24,
	icons: []
};


var itemsProcessed = 0;

exports.scrape = function(sourceURL) {
	// clear bin
	clearBin(json.binDir);

	// find all the svg assets in a directory
	fs.readdir(sourceURL, function (err, list) {
		if (err) {
			throw err;
		}

		// filter and include only svgs to avoid hidden file errors
		list = list.filter(el => /\.svg$/.test(el));

		list.forEach( (file, index, array) => {
			// Full path of that file
			var path = sourceURL + "/" + file;

			fs.readFile(path, function read(err, data) {
				if (err) {
					throw err;
				}

				var glyph = data;
			
				// load svg data
				var $ = cheerio.load(glyph, {
					// xmlMode: true,
					lowerCaseTags: false,
					ignoreWhitespace: true
				});
				var svgData = $("svg");

				// set meta data
				glyph.metadata = { name: "", unicode: "", canvasTransform: "", pathTransform: "", d: "" };

				// set title and name as filename, make lower case and replace out "-" and " " to "_"
				glyph.metadata.name = file.replace(/[\s-]/g, '_').replace(/\.[^/.]+$/, "").toLowerCase();

				glyph.metadata.style = $('defs style').html();
				glyph.metadata.path = [];
				glyph.metadata.unicode = glyph.metadata.name.replace("ic_", "");
				glyph.metadata.canvasTransform = $('#Canvas').attr('transform');

				// remove clippath
				$("clipPath").remove();
				$("clip-path").remove();
				$('[clip-path]').removeAttr('clip-path');
				$('[clip-rule]').removeAttr('clip-rule');
				$('[fill-rule]').removeAttr('fill-rule');
				$("defs").remove();

				// check if figma is using USE tags or not
				// if ( $("desc").html() === "Created using Figma"  ) {
				if ( $("use").html() === null ) {
					// console.log('no use tag for ' + glyph.metadata.name);
					glyph.data = $("body").html();
					// console.log(glyph.data);
					writeSVG(glyph, array);
				} else {
					console.log("this is happening");
					// console.log('found use for ' + glyph.metadata.name);
					// get all types for paths and parse them
					var pathTypes = ['path', 'rect', 'line', 'circle', 'ellipsis', 'polyline', 'polygon', 'use'];

					pathTypes.forEach(function(value) {
						$(value).each(function(i, elem) {
							var parsedPath = parsePath($(this).get(0));
							var singlePathTransform = $(elem).parent().attr('transform');

							// figma uses weird defs and use tags. Account for these by ignoring paths in defs
							// and then convert use tags to paths
							if (this.parent.name === 'defs') {
								return
							} else if (this.name === 'use') {

								// // get the id and match it with figmas use transform
								const singlePathID = $(elem).attr('href');
								const singlePathTransform = $(elem).attr('transform');

								const newPathFromDef = $('defs ' + singlePathID);
								const newFormatedPathFromDef = newPathFromDef.attr('transform', singlePathTransform).get(0);
								parsedPath = parsePath(newFormatedPathFromDef);

							} else if (singlePathTransform) {
								const newFormatedPathFromDef = $(elem).attr("transform", singlePathTransform).get(0);
								parsedPath = parsePath(newFormatedPathFromDef);
							}
							glyph.metadata.path.push(parsedPath);
						});
					});
					cleanSVG("./lib/svg_template.svg", glyph, array);


				}

			});
		});
	});
}

parsePath = function(data) {
	var newAttribs = ""

	Object.keys(data.attribs).forEach(function(key) {
		var val = data.attribs[key];
		newAttribs = newAttribs + " " + key + '="' + val + '"';
	});

	const newPathHTML = '<' + data.name + newAttribs + '/>';
	return newPathHTML
}

clearBin = function(path) {
	deleteFolderRecursive(path);
	fs.mkdirSync(path);
	fs.mkdirSync(path + '/svg/');
}

deleteFolderRecursive = function(path) {
	if (fs.existsSync(path)) {
		fs.readdirSync(path).forEach(function(file, index){
			var curPath = path + "/" + file;
			if (fs.lstatSync(curPath).isDirectory()) { // recurse
				deleteFolderRecursive(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
};

cleanSVG = function(sourceURL, glyph, array) {
	fs.readFile(sourceURL, function read(err, data) {
		if (err) {
			throw err;
		}

		var $ = cheerio.load(data, {
			xmlMode: true
		});
		var fontData = $("svg");

		// <svg width="24" height="24" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
		// set meta
		$('svg').attr("width", json.fontBoxSize);
		$('svg').attr("height", json.fontBoxSize);
		$('svg').attr("viewBox", '0 0 ' + json.fontBoxSize + ' ' + json.fontBoxSize);

		$('title').text(glyph.metadata.name);
		$('#Canvas').attr("transform", glyph.metadata.canvasTransform);
		$('#Container').append(glyph.metadata.path);
		$('defs').append('<style>' + glyph.metadata.style) + '</style>';

		// $('path').attr("d", glyph.metadata.d);
		
		var newSVGData = {
			name: glyph.metadata.name,
			unicode: glyph.metadata.unicode,
			url: json.binDir + '/svg/' + glyph.metadata.name + '.svg',
			data: $.xml()
		};

		// Going to individually write new clean svgs and push data to json to ref
		json.icons.push(newSVGData);
		fs.writeFileSync(newSVGData.url, newSVGData.data, 'utf8');

		// since forEach is async we need to put a counter here
		loopCounter(newSVGData.unicode, array.length);
	});
}

writeSVG = function(glyph, array) {
	var newSVGData = {
		name: glyph.metadata.name,
		unicode: glyph.metadata.unicode,
		url: json.binDir + '/svg/' + glyph.metadata.name + '.svg',
		data: glyph.data
	};

	// console.log(newSVGData);

	// Going to individually write new clean svgs and push data to json to ref
	json.icons.push(newSVGData);
	fs.writeFileSync(newSVGData.url, newSVGData.data, 'utf8');

	// since forEach is async we need to put a counter here
	loopCounter(newSVGData.unicode, array.length);
}

loopCounter = function(name, length) {
	// counter for async directory, will writejson and write fonts when loop is over
	itemsProcessed++;
	// console.log(itemsProcessed + '/' + length, name);

	if(itemsProcessed === length) {
		// console.log('writefont');
		writeJSON(json);
		writeSwift(json);
		writeFontStream();
	};
}

function errorHandler(err, data) {
	console.log('rat')
	if (err) {
		throw err;
	}
}

function writeJSON(data) {
	// var jsonString = JSON.stringify(data);
	var jsonString = data;
	fs.writeFile(json.binDir + '/' + json.fontName + '.json', jsonString, 'utf8');
}

function writeSwift(data) {
	data.icons = data.icons.sort(compare);

	var jsonString = 
		"//" + '\n' + 
		"/// Font generated on " + getDateTime() + '\n' +
		"public enum IconType: String {"

	data.icons.forEach( (file, index, array) => {
		jsonString = jsonString.concat('\n    ' + "case " + file.unicode);
	});

	jsonString = jsonString.concat('\n' + "}" + '\n');

	fs.writeFile(json.binDir + '/' + "IconType" + '.swift', jsonString, 'utf8');
}

function getDateTime() {

	var date = new Date();

	var hour = date.getHours();
	var min  = date.getMinutes();
	var ampm = hour >= 12 ? 'pm' : 'am';

	hour = hour % 12;
	hour = hour ? hour : 12; // the hour '0' should be '12'
	min = min < 10 ? '0'+min : min;

	var year = date.getFullYear();

	var month = date.getMonth() + 1;
	month = (month < 10 ? "0" : "") + month;

	var day  = date.getDate();
	day = (day < 10 ? "0" : "") + day;

	return month + "/" + day + "/" + year + " " + hour + ":" + min + ampm;
}


function compare(a, b) {
	if (a.name < b.name)
		return -1;
	if (a.name > b.name)
		return 1;
	return 0;
}

writeFontStream = function(name, svgData) {
	const fontStream = new SVGIcons2SVGFontStream({
		fontName: json.fontName,
		normalize: true,
		// round: 0,
		fontId: json.fontId,
		fontStyle: json.fontStyle,
		// centerHorizontally: true,
		// fixedWidth: true,
		fontHeight: 1000 + (json.fontBoxSize - 1000 % json.fontBoxSize) //this needs to be > 1000 but divisible by 24
	});

	fontStream.pipe(fs.createWriteStream(json.binDir + '/' + json.fontName + '.svg'))
		.on('finish',function() {
			addMissingGlyph();
			writeTTF();
		})
		.on('error',function(err) {
			console.log(err);
		});

		// fontstream doesn't let me load data directly so i have to create a new read stream and read from the new svgs
		json.icons.forEach( (file, index, array) => {
			// console.log(file.name);
			glyph = fs.createReadStream(file.url);
			glyph.metadata = {
				unicode: [file.unicode],
				name: file.unicode
			};
			fontStream.write(glyph);
		});
	fontStream.end();
}

function addMissingGlyph() {	
	var $ = cheerio.load(fs.readFileSync(json.binDir + '/' + json.fontName + '.svg', 'utf8'), {
		xmlMode: true,
		lowerCaseTags: false
	});
	// set missing glyph
	$("svg missing-glyph").attr("d", 'M588 483L588 199.5L672 126L672 42L504 84L336 42L336 126L420 199.5L420 483L84 399L84 504L420 672L420 882C420 928.204116 457.79958 966 504 966C550.1999999999999 966 588 928.204116 588 882L588 672L924 504L924 399L588 483z');
	$("svg missing-glyph").attr("horiz-adv-x", 1000 + (json.fontBoxSize - 1000 % json.fontBoxSize));

	fs.writeFileSync(json.binDir + '/' + json.fontName + '.svg', $.xml());
	// console.log($.html());
}

function writeTTF() {
	var ttf = svg2ttf(fs.readFileSync(json.binDir + '/' + json.fontName + '.svg', 'utf8'), {});
	fs.writeFileSync(json.binDir + '/' + json.fontFileName + '.ttf', new Buffer(ttf.buffer));
	createGallery('./lib/gallery_template.html');
	console.log('ttf successfully created!')
}

function createGallery(sourceURL) {

	fs.readFile(sourceURL, function read(err, data) {
		if (err) {
			throw err;
		}

		var $ = cheerio.load(data, {ignoreWhitespace: true});
		// set meta
		// $('body').text(glyph.metadata.name);
		$('style').prepend(
			'@font-face {' +
				'font-family: "' + json.fontName + '";' + 
				'src: url("' + json.fontName + '.ttf' + '") format ("truetype");' + 
			'}' + 

			'icon {' +
				'font-family: "' + json.fontName + '";' + 
			'}'
		);

		json.icons.forEach( (file, index, array) => {
			// console.log(file.unicode);

			$('#gallery').append(
				'<span style="" class="galleryContainer col-4 block border border-transparent" id=' + file.unicode + '>' + 
					'<span class="">' + 
						'<icon class="block">' + file.unicode + '</icon>' + 
						'<h5 class="book center">' + file.unicode + '</h5>' + 
					'</span>' + 
				'</span>'
			);
		});

		fs.writeFileSync(json.binDir + '/' + 'font.html', $.html(), 'utf8');
	});
}

exports.scrape(json.resourceDir);


// Todo: future read a full directory
// fs.readdir(json.resourceDir, function (err, list) {
// 	if (err) {
// 		throw err;
// 	}
// 	// // filter and include only svgs to avoid hidden file errors
// 	list = list.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));

// 	console.log(list);
// });