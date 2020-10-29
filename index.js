const { keyboard, Key, mouse, straightTo, centerOf, left, right, up, down, screen, Region } = require("@nut-tree/nut-js");
const Tesseract = require( "tesseract.js" );
const sharp = require( "sharp" );
const fs = require( "fs" );
const looksSame = require( "looks-same" );

screen.config.confidence = 0.85;
screen.config.highlightDurationMs = 3000;
screen.config.resourceDirectory = "./";
mouse.config.mouseSpeed = 2000;
const width = 1768, height = 992;
let sWidth = 1768, sHeight = 992;

function isImageSame( img1, img2 ) {
	return new Promise( res => {
		looksSame( img1, img2, ( err, { equal } ) => {
			res( equal );
		} );
	} );
}

const square = async () => {
  await mouse.move(right(500));
  await mouse.move(down(500));
  await mouse.move(left(500));
  await mouse.move(up(500));
};

function adjustCoords( region ) {
	const xR = sWidth / width;
	const yR = sHeight / height;
	return new Region( region.left * xR, region.top * yR, region.width * xR, region.height * yR );
}

function delay( time ) {
	return new Promise( res => setTimeout( res, time ) );
}

async function findOrNull( image ) {
	try {
		let location = null;
		if( objectCache[ image ] ) {
			location = objectCache[ image ];
		}
		else {
			location = objectCache[ image ] = await screen.find( image );
		}
		return location;
	}
	catch( err ) {
		return null;
	}
}

let objectCache = {};

async function findAndMove( image, waitFor = 0 ) {
	try {
		let location = null;
		if( objectCache[ image ] ) {
			location = objectCache[ image ];
		}
		else {
			location = objectCache[ image ] = waitFor ? await screen.waitFor( image, waitFor ) : await screen.find( image );
		}
		await mouse.move(
			straightTo(
				centerOf(
					adjustCoords(
						location
					)
				)
			)
		);
		// await mouse.move( up( 300 ) );
		// await delay( 500 );
	}
	catch( err ) {}
}

async function findAndClick( image, waitFor = 0 ) {
	await findAndMove( image, waitFor );
	await mouse.leftClick();
	await delay( 200 );
}

async function moveAndClick( region ) {
	await mouse.move(
		straightTo(
			centerOf(
				adjustCoords(
					region
				)
			)
		)
	);
	await mouse.leftClick();
	await mouse.move(up(500));
}

const start = async () => {
	sWidth = await screen.width();
	sHeight = await screen.height();
	// console.log( await screen.width(), await screen.height() );
	// await screen.capture( "capture.png" );
	// let region = await adjustCoords( await screen.find( "start.png" ) );
	// console.log( region );
	// screen.highlight( region );
	// await mouse.move(
	// 	straightTo(
	// 		centerOf(
	// 			region
	// 		)
	// 	)
	// );
	await findAndMove( "rungame.png" );
	await mouse.leftClick();
	await delay( 5000 );
	await findAndMove( "start.png" );
	await mouse.leftClick();
	await delay( 500 );
	await findAndMove( "next.png" );
	await mouse.leftClick();
	await delay( 500 );
	await findAndMove( "next.png" );
	await mouse.leftClick();
	await delay( 500 );
	await findAndMove( "next.png" );
	await mouse.leftClick();
	await delay( 500 );
	await findAndMove( "next.png" );
	await mouse.leftClick();
}

async function grabIngredient( ingredient, isFirst = false ) {
	console.log( `Grabbing ${ingredient}` );
	await findAndMove( `${ingredient}.png` );
	await mouse.pressButton( 0 );
	// if( isFirst ) {
		await findAndMove( "spoon.png" );
	// }
	// else {
		// await findAndMove( "spoon2.png" );
	// }
	await mouse.releaseButton( 0 );
}

async function spinAndServe() {
	await delay( 100 );
	await mouse.pressButton( 0 );
	await mouse.move( down( 20 ) );
	await mouse.move( right( 10 ) );
	await mouse.move( down( 20 ) );
	await mouse.move( left( 100 ) );
	await mouse.move( up( 20 ) );
	await mouse.move( right( 10 ) );
	await mouse.move( up( 20 ) );
	await mouse.releaseButton( 0 );
	await delay( 100 );
	await findAndClick( "servesoup.png", 2000 );
}

(async () => {
	sWidth = await screen.width();
	sHeight = await screen.height();

	await findAndClick( "rungame.png" );
	await findAndClick( "start.png", 10000 );
	await findAndClick( "next.png", 2000 );
	for( let i = 0; i < 8; i++ ) {
		await mouse.leftClick();
		await delay( 100 );
	}
	for( let level = 0; true; level++ ) {
		objectCache = {}; // Clear object cache
		for( let round = 0; round < 3; round++ ) {
			console.log( `ROUND #${round+1}` );
			let numSoups = 6;
			switch( level ) {
			case 0:
				numSoups = 6;
				if( round > 0 ) {
					numSoups = 5;
				}
				break;
			case 1:
				numSoups = 9;
				if( round === 1 ) {
					numSoups = 7;
				}
				else if( round > 1 ) {
					numSoups = 5;
				}
			}
			for( let r = 0; r < numSoups; r++ ) {
				console.log( `Detecting Recipe for Soup #${r+1}!` );
				let soupRegion = await findOrNull( "soupstogo.png" );
				if( fs.existsSync( "capture.png" ) ) {
					try {
						fs.unlinkSync( "capture.png" );
					}
					catch( err ) {
						console.log( err );
					}
				}
				await screen.capture( "capture.png" );
				await sharp( fs.readFileSync( "capture.png" ) ).extract( {
					width: Math.floor( soupRegion.width * 1.85 ), height: Math.floor( soupRegion.height ),
					left: Math.floor( soupRegion.left - soupRegion.width * 0.4 ), top: Math.floor( soupRegion.top + soupRegion.height * 1.275 )
				} ).toFile( `recipe_${r+1}.png` );

				// OCR THINGS
				// let ocrData = await Tesseract.recognize( `recipe_${r+1}.png`, "eng", {
				// 	// logger: m => console.log( m )
				// });
				// console.log( ocrData.data.text );
				// let recipeText = ocrData.data.text.toLowerCase();

				// IMAGE COMPARISON THINGS
				if( await isImageSame( `recipe_${r+1}.png`, `soup_tomato.png` ) ) {
					recipeText = "tomato soup";
				}
				else if( await isImageSame( `recipe_${r+1}.png`, `soup_onion.png` ) ) {
					recipeText = "onion soup";
				}
				else if( await isImageSame( `recipe_${r+1}.png`, `soup_zucchini.png` ) ) {
					recipeText = "zucchini soup";
				}
				else if( await isImageSame( `recipe_${r+1}.png`, `soup_veggie.png` ) ) {
					recipeText = "veggie soup";
				}
				else if( await isImageSame( `recipe_${r+1}.png`, `soup_gaspacho.png` ) ) {
					recipeText = "gaspacho";
				}
				else if( await isImageSame( `recipe_${r+1}.png`, `soup_pepper.png` ) ) {
					recipeText = "pepper soup";
				}
				else if( await isImageSame( `recipe_${r+1}.png`, `soup_minestrone.png` ) ) {
					recipeText = "minestrone";
				}
				else if( await isImageSame( `recipe_${r+1}.png`, `soup_shroomveloute.png` ) ) {
					recipeText = "shroom veloute";
				}
				else if( await isImageSame( `recipe_${r+1}.png`, `soup_chickenmushroom.png` ) ) {
					recipeText = "chicken mushroom";
				}
				else if( await isImageSame( `recipe_${r+1}.png`, `soup_harira.png` ) ) {
					recipeText = "harira";
				}
				else if( await isImageSame( `recipe_${r+1}.png`, `soup_ramenbroth.png` ) ) {
					recipeText = "ramen broth";
				}
				else {
					// OCR THINGS
					let ocrData = await Tesseract.recognize( `recipe_${r+1}.png`, "eng", {
						// logger: m => console.log( m )
					});
					recipeText = ocrData.data.text.toLowerCase();
				}
				// console.log( recipeText );
				if( recipeText.includes( "tomato" ) || recipeText.includes( "tomto" ) ) {
					console.log( "TOMATO SOUP" );
					// screen.highlight( adjustCoords( tomato ) );
					await grabIngredient( "tomato", true );
					await grabIngredient( "tomato" );
					await grabIngredient( "tomato" );
					await spinAndServe();
				}
				else if( recipeText.includes( "onion" ) || recipeText.includes( "onon" ) ) {
					console.log( "ONION SOUP" );
					// screen.highlight( adjustCoords( tomato ) );
					await grabIngredient( "onion", true );
					await grabIngredient( "onion" );
					await grabIngredient( "onion" );
					await spinAndServe();
				}
				else if( recipeText.includes( "zullhing" ) || recipeText.includes( "zu" ) ) {
					console.log( "ZUCCHINI SOUP" );
					// screen.highlight( adjustCoords( tomato ) );
					await grabIngredient( "zucchini", true );
					await grabIngredient( "zucchini" );
					await grabIngredient( "zucchini" );
					await spinAndServe();
				}
				else if( recipeText.includes( "veggie" ) || recipeText.includes( "veg" ) ) {
					console.log( "VEGGIE SOUP" );
					// screen.highlight( adjustCoords( tomato ) );
					await grabIngredient( "tomato", true );
					await grabIngredient( "zucchini" );
					await grabIngredient( "onion" );
					await spinAndServe();
				}
				else if( recipeText.includes( "gaspalho" ) || recipeText.includes( "gas" ) ) {
					console.log( "GASPACHO" );
					// screen.highlight( adjustCoords( tomato ) );
					await grabIngredient( "tomato", true );
					await grabIngredient( "tomato" );
					await grabIngredient( "pepper" );
					await grabIngredient( "pepper" );
					await grabIngredient( "onion" );
					await grabIngredient( "onion" );
					await spinAndServe();
				}
				else if( recipeText.includes( "minestrone" ) || recipeText.includes( "mine" ) ) {
					console.log( "MINESTRONE" );
					// screen.highlight( adjustCoords( tomato ) );
					await grabIngredient( "tomato", true );
					await grabIngredient( "tomato" );
					await grabIngredient( "carrot" );
					await grabIngredient( "carrot" );
					await grabIngredient( "onion" );
					await grabIngredient( "onion" );
					await spinAndServe();
				}
				else if( recipeText.includes( "veloute" ) ) {
					console.log( "SHROOM VELOUTE" );
					// screen.highlight( adjustCoords( tomato ) );
					await grabIngredient( "mushroom", true );
					await grabIngredient( "mushroom" );
					await grabIngredient( "carrot" );
					await grabIngredient( "onion" );
					await spinAndServe();
				}
				else if( recipeText.includes( "pepper" ) || recipeText.includes( "pep" ) ) {
					console.log( "PEPPER SOUP" );
					// screen.highlight( adjustCoords( tomato ) );
					await grabIngredient( "pepper", true );
					await grabIngredient( "pepper" );
					await grabIngredient( "pepper" );
					await grabIngredient( "onion" );
					await spinAndServe();
				}
				else if( recipeText.includes( "chicken" ) || recipeText.includes( "chic" ) ) {
					console.log( "CHICKEN MUSHROOM" );
					// screen.highlight( adjustCoords( tomato ) );
					await grabIngredient( "mushroom", true );
					await grabIngredient( "mushroom" );
					await grabIngredient( "onion" );
					await grabIngredient( "chicken" );
					await spinAndServe();
				}
				else if( recipeText.includes( "harira" ) || recipeText.includes( "hari" ) ) {
					console.log( "HARIRA" );
					// screen.highlight( adjustCoords( tomato ) );
					await grabIngredient( "tomato", true );
					await grabIngredient( "tomato" );
					await grabIngredient( "onion" );
					await grabIngredient( "onion" );
					await grabIngredient( "chicken" );
					await grabIngredient( "chicken" );
					await grabIngredient( "steak" );
					await grabIngredient( "steak" );
					await spinAndServe();
				}
				else if( recipeText.includes( "ramen" ) || recipeText.includes( "ram" ) ) {
					console.log( "RAMEN BROTH" );
					// screen.highlight( adjustCoords( tomato ) );
					await grabIngredient( "mushrom", true );
					await grabIngredient( "chicken" );
					await grabIngredient( "onion" );
					await grabIngredient( "fish" );
					await spinAndServe();
				}
				await delay( 100 );
			}
			// Click Next
			await findAndClick( "next.png", 2000 );
		}
		// Click Next
		await findAndClick( "next.png", 2000 );
		for( let i = 0; i < 5; i++ ) {
			await mouse.leftClick();
			await delay( 100 );
		}
	}
})();

// start();
