function handleFileSelect(evt) {
    var files = this.files;
    if (!files.length) {
      alert('Please select a file!');
      return;
    }

    var file = files[0];
    var reader = new FileReader();
    reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
            loadCSV(evt.target.result);
        }  
    };
    reader.readAsText(file, "UTF-8");
}

function findUniqueValues(dataSet, colId) {
    var unique = {};
    for(var i in dataSet) {
        var thisRow = dataSet[i];
        if(thisRow[colId] === '') thisRow[colId] = '[BLANK]';
        unique[thisRow[colId]] = unique[thisRow[colId]] || 0;
        unique[thisRow[colId]]++;
    }
    return unique;
}

function filterDataRows(rows) {
    var newRows = [];
    for(var i=0; i<rows.length; i++) {
        var thisRow = rows[i];
        var joined = rows[i].join('').replace(' ', '');
        if(joined == '') continue;
        if(joined.substr(0,8) == 'ABCDEFGH') continue;

        newRows.push(thisRow);
    }

    return newRows;
}
function loadCSV(csvText) {
    var data = $.csv.toArrays(csvText);

    var fieldNames = data.shift();// First row is header.

    var gridOptions = {
        keyByColumn: 0
        ,onRowClicked: function(rowId, rowData){
            
        }
        ,container  : '.valve-list'
        ,resizable  : true
        ,sortable   : false
        ,columns: {

        }
    };
    for(var i=0; i<fieldNames.length; i++) {
        var filterValues = findUniqueValues(data, i);
        var filterKeys   = Object.keys(filterValues);

        if(filterKeys.length > 1)
            gridOptions.columns[fieldNames[i].split(' ').join('-')] = {
                label: fieldNames[i],
                inputDataKey: i,
                values: filterValues,
                cardinality: data.length / filterKeys.length
              //  sortAs: 'INT'
            };
    }


    window.myGrid = new esGrid( gridOptions );
    
    data = filterDataRows(data);
    myGrid.loadData( data );

    $('.header').hide();
}

$(function(){
    $('#csv_file').on('change', handleFileSelect);
});