WebDJ.SongBrowser = (function(){
	var self = {};
	


	self.initDom = function(){
		self.dom = {
			container: $('<div>').addClass('song-browser').appendTo('#INTERFACE_CONTAINER')
		};
		
		self.dom.fileList = $('<ul>').appendTo(self.dom.container).hide();
		
		self.dom.container.on('mousedown', 'tr', function(e){
			e.preventDefault(); e.stopPropagation();
			var fileInfo = $(this).data('controller').values;
			console.log(fileInfo);
			$(document).one('mouseup', function(e){
				var deckAPI = $(e.srcElement).closest('.deck-container').data('deckAPI');
				deckAPI.loadTrackByURL(WebDJ.rootFilePath+fileInfo.fileName);
				console.log(deckAPI, this);
			})
		});
		
		self.hasInitialized = true;
	};
	
	
	self.renderList = function(){
		if(!self.hasInitialized) self.initDom();
		
		var fileList = WebDJ.SongInfo.knownFiles;
		
		for(var i=0; i<fileList.length; i++){
			var keyparts = fileList[i].fileName.split(' - ');
			fileList[i].songName = fileList[i].fileName;
fileList[i].id = i;
			if( keyparts[0].length === 1 || keyparts[0].length === 2 ){
				fileList[i].key = keyparts[0];
				fileList[i].songName = keyparts[1];
			}
			$('<li>')
				.data('fileInfo', fileList[i])
				.text(fileList[i].fileName)
				.appendTo(self.dom.fileList);
		}


		var gridOptions = {
			keyByColumn: 'id'
			,onRowClicked: function(id, row){
				console.log(id, row, this);
			}
			,container  : self.dom.container
			,resizable	: true
			,sortable		: true
			,columns: {
				key: {
					label        : 'Scale',
					inputDataKey : 'key'
				},
				name: {
					label: 'Name',
					inputDataKey: 'songName'
				},
				bpm: {
					label: 'BPM',
					inputDataKey: 'bpm'
				}
			}
		};

	    window.myGrid = new esGrid( gridOptions );
	    
	    myGrid.loadData( fileList );

	};
	

	
	return self;
}());