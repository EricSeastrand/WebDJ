window.WebDJ.SongInfo = (function(){
	var self = {};
	
	self.knownFiles = [
		{
			fileName: 'E - Animal Rights Original Mix - Deadmau5  Wolfgang Gartner.mp3',
			bpm		: 128,
			offset	: 1.633,
			cuePoints: [
				{
					title: '32 intro',
					location: {
						bars: 0,
						beats: 0
					}
				},{
					title: 'build 1',
					location: {
						bars: 33,
						beats: 0
					}
				},{
					title: 'drop 1',
					location: {
						bars: 49,
						beats: 0
					}
				},{
					title: 'breakdown 1',
					location: {
						bars: 97,
						beats: 0
					}
				},{
					title: 'outro',
					location: {
						bars: 113,
						beats: 0
					}
				}
			]
		},{
			fileName: 'E - Community Funk - Deadmau5 Remix - Burufunk, Carbon Community.mp3',
			bpm		: 128,
			offset	: 0.009
		},{//2.666666666686069
			fileName: 'E - Less Go! (Porter Robinson Remix) - Spencer & Hill feat. Lil Jon.mp3',
			bpm		: 128,
			offset	: 0,
			cuePoints: [
				{
					title: '32 intro',
					location: {
						bars: 0,
						beats: 0
					}
				},{
					title: 'drop 1',
					location: {
						bars: 33,
						beats: 0
					}
				},{
					title: 'breakdown 1',
					location: {
						bars: 65,
						beats: 0
					}
				},{
					title: 'build 1',
					location: {
						bars: 93,
						beats: 0
					}
				},{
					title: 'drop 2.1',
					location: {
						bars: 141,
						beats: 0
					}
				},{
					title: 'drop 2.1',
					location: {
						bars: 141,
						beats: 0
					}
				},{
					title: 'breakdown 2',
					location: {
						bars: 157,
						beats: 0
					}
				},{
					title: 'drop 3',
					location: {
						bars: 173,
						beats: 0
					}
				},{
					title: '32 outro',
					location: {
						bars: 189,
						beats: 0
					}
				}
			]
		},
		{
			fileName: 'E - The Time (The Dirty Bit) (Felguk Remix) - The Black Eyed Peas.mp3',
			bpm		: 130,
			offset	: 0
		},
		{
			fileName: 'A - Close to Me (R3hab Remix) - Benny Benassi ft. Gary Go.mp3',
			bpm		: 128,
			offset	: 0
		},{
			fileName: 'A - Swedish House Mafia - Save The World (Knife Party Remix).mp3',
			bpm		: 125,
			offset	: 0.023
		},{
			fileName: 'E - Duck Sauce - Barbra Streisand (Darth & Vader Remix).mp3',
			bpm		: 128,
			offset	: 0.027
		}		
	];
	
	self.getInfoFor = function(fileName){
		for(var i=0; i<self.knownFiles.length; i++){
			if( fileName.indexOf(self.knownFiles[i].fileName) != -1 ){
				return self.knownFiles[i];
			}
		}
	}
	
	
	return self;
}());
