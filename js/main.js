MyApp = {};
MyApp.spreadsheetData = [];
MyApp.headerData = [
    { "sTitle": "Researcher Name" }, { "sTitle": "College" }, 
    { "sTitle": "Department"}, { "sTitle": "Researcher Title"}, 
    { "sTitle": "Website"}, { "sTitle": "Email"}, 
    { "sTitle": "Keywords"}
];

MyApp.filterIndexes = { "colleges": 1, "departments": 2, "researchtitles": 3 };
MyApp.Colleges = [], MyApp.ResearchTitles = [], MyApp.Departments = [];

$(function () {
    var url = "https://spreadsheets.google.com/feeds/list/0AhTxmYCYi3fpdHI5RnliaG1yMGZxeEVTYnJXc1Fxb3c/1/public/values?alt=json-in-script&callback=?";
    $.getJSON(url, {}, function (data) {
        $.each(data.feed.entry, function (key, val) {
            var college = val.gsx$college.$t;
            var researchTitle = val.gsx$researchertitle.$t;
            var department = val.gsx$department.$t;
            var website = "<a target='_blank' href='" + val.gsx$website.$t + "'>" + val.gsx$website.$t + "</a>";
            var email = "<a href='mailto:" + val["gsx$e-mail"].$t + "'>" + val["gsx$e-mail"].$t + "</a>";

            MyApp.spreadsheetData.push(

                [
                    val.gsx$researchername.$t, college,
                    department, researchTitle,
                    website, email,
                    val.gsx$keywords.$t
                ]);

            if ($.inArray(college, MyApp.Colleges) === -1) {
                MyApp.Colleges.push(college);
            }

            if ($.inArray(researchTitle, MyApp.ResearchTitles) === -1 && researchTitle.length !== 0) {
                MyApp.ResearchTitles.push(researchTitle);
            }

            if ($.inArray(department, MyApp.Departments) === -1 && department.length !== 0) {
                MyApp.Departments.push(department);
            }
        });

        MyApp.Colleges.sort();
        MyApp.Departments.sort();

        createDataTable();
        addFilters();
    });
})

function hideUnavailableDepartments(){
    var fileredData = MyApp.oTable._('tr', {"filter":"applied"});

    //Get departments available after the filters are set
    MyApp.Departments = [];
    $.each(fileredData, function (key, val) {
        var department = val[MyApp.filterIndexes["departments"]];

        if ($.inArray(department, MyApp.Departments) === -1 && department.length !== 0) {
                MyApp.Departments.push(department);
        }
    });

    $(":checkbox", "#departments").each(function () {
        //if a checkbox isn't in the list of available departments, hide it
        if ($.inArray(this.name, MyApp.Departments) === -1) {
            $(this).parent().css("display", "none");
        } else {
            $(this).parent().css("display", "block");
        }
    });
}

function addFilters(){
    var $colleges = $("#colleges");
    
    $.each(MyApp.Colleges, function (key, val) {
        $colleges.append('<li><label><input type="checkbox" name="' + val + '"> ' + val + '</label></li>');
    });

    var $departments = $("#departments");
    
    $.each(MyApp.Departments, function (key, val) {
        $departments.append('<li><label><input type="checkbox" name="' + val + '"> ' + val + '</label></li>');
    });

    $(".filterrow").on("click", "ul.filterlist", function (e) {
        var filterRegex = "";
        var filterIndex = MyApp.filterIndexes[this.id];

        var filters = [];
        $("input", this).each(function (key, val) {
            if (val.checked) {
                if (filterRegex.length !== 0) {
                    filterRegex += "|";
                }

                filterRegex += "(^" + val.name + "$)"; //Use the hat and dollar to require an exact match
            }
        });

        MyApp.oTable.fnFilter(filterRegex, filterIndex, true, false);
        hideUnavailableDepartments();
        displayCurrentFilters();
    });

    $("#clearfilters").click(function (e) {
        e.preventDefault();

        $(":checkbox", "ul.filterlist").each(function () {
            this.checked = false;
        });
                
        $("ul.filterlist").click();
    });
}

function displayCurrentFilters(){
    var $filterAlert = $("#filters");
    var filters = "";
    $(":checked", "ul.filterlist").each(function () {
        if (filters.length !== 0){
            filters += " + "
        }
        filters += "<strong>" + this.name + "</strong>";        
    });

    if (filters.length !== 0){     
        var alert = $("<div class='alert alert-info'><strong>Filters</strong><p>You are filtering on " + filters + "</p></div>")

        $filterAlert.html(alert);   
    } else{
        $filterAlert.html(null);  
    }

    $filterAlert[0].scrollIntoView( true );
}

function createDataTable() {
    MyApp.oTable = $("#spreadsheet").dataTable({
        "aoColumnDefs": [
            { "bVisible": false, "aTargets": [ -1 ] } //hide the keywords column for now (the last column, hence -1)
        ],
        "iDisplayLength": 20,
        "bLengthChange": false,
        "aaData": MyApp.spreadsheetData,
        "aoColumns": MyApp.headerData
    });
}