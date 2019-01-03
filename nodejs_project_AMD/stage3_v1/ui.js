
function disp_overview(result, draw_data){
    var type = result.aggregations.type.buckets;

    var overview;
    var overview_txt = "<table id='over_txt' border='0' align='center'><tr><th>Log Folder</th><th>Log Name</th><th>Log Results Amount</th><th>Folder Results Amount</th></tr>"; // table of txt
    var overview_db = "<table id='over_db' border='0' align='center'><tr><th>Database Name</th><th>Data Amount</th></tr>"; // table of db

    for (var i = 0; i < type.length; i++){

        // overview of txt files
        if (type[i].key === 'txt'){
            var count_folder = type[i].folder.buckets;
            for (var j = 0; j < count_folder.length; j++){
                var count_log = count_folder[j].log.buckets;

                overview_txt += "<tr><td align='center' rowspan='" + count_log.length + "'>" + count_folder[j].key + "</td>";
                overview_txt += "<td align='center'><a href='http://localhost:8888/download?file=" + count_folder[j].key + "/" + count_log[0].key + "'>" + count_log[0].key + "</td>";
                overview_txt += "<td align='center'>" + count_log[0].doc_count + "</td>";
                overview_txt += "<td align='center' rowspan='" + count_log.length + "'>" + count_folder[j].doc_count + "</td></tr>";
                draw_data [count_log[0].key] = count_log[0].doc_count; // restore for drawing
                for (var k = 1; k < count_log.length; k++){
                    overview_txt += "<td align='center'><a href='http://localhost:8888/download?file=" + count_folder[j].key + "/" + count_log[k].key + "'>" + count_log[k].key + "</td>";
                    overview_txt += "<td align='center'>" + count_log[k].doc_count + "</td></tr>";
                    draw_data [count_log[k].key] = count_log[k].doc_count;
                }

            }
            overview_txt += "</table><br>";
        }
        // overall of database
        else{
            overview_db += "<tr><td align='center'><b>" + type[i].key + "</b></td><td align='center'>" + type[i].doc_count + "</td>"
            draw_data ["DB_" + type[i].key] = type[i].doc_count;
        }
    }
    overview_db += "</table><br>";
    overview = overview_db + overview_txt;

    return overview;
}


function disp_detail(result, keycontent){

    var hits = result.hits.hits;  // the detailed query result

    var disp_time_limit = 4;
    var used_log = [];  // record the logs that display more than limit times
    var disp_time = 0;
    var disp_number = 1;
    var disp_content = "<table id=\"display_content\" border=\"0\" align=\"center\">";
    disp_content += "<tr><th>Number</th><th>Log Folder</th><th>Log Name</th><th>Log Date</th><th>Log Time</th><th>Message</th></tr>";
    for(var i = 0; i < hits.length; i++){
        var log_folder = hits[i]._source.log_folder;

        // limit the time of display for each log
        var log_name = hits[i]._source.log_name;
        // skip the used names
        if (used_log.indexOf(log_name) != -1){continue;}
        if (disp_time >= disp_time_limit){
            disp_time = 0;
            used_log.push(log_name);
            continue;
        }
        disp_time ++;

        if (hits[i]._source.log_content){
            var log_content =  hits[i]._source.log_content.replace(/\</g,'\[').replace(/\>/g,'\]');
        }
        else{
            var log_content =  hits[i]._source.message.replace(/\</g,'\[').replace(/\>/g,'\]');
        }
        // highlight keywords
        var keyreg = new RegExp(keycontent, 'ig');
        log_content = log_content.replace(keyreg, '<mark>' + keycontent + '</mark>');

        disp_content += "<tr><td align='center'>" + disp_number + "</td>";
        disp_content += "<td align='center'>" + log_folder + "</td>";
        disp_content += "<td align='center'><a href='http://localhost:8888/download?file=" + log_folder + "/" + log_name + "'>" + log_name + "</a></td>";
        disp_content += "<td align='center'>" + hits[i]._source.log_date + "</td>";
        disp_content += "<td align='center'>" + hits[i]._source.log_time + "</td>";
        disp_content += "<td><pre>" + log_content + "</pre></td></tr>";

        disp_number ++;
    }
    disp_content += "</table>";

    return disp_content;
}


function disp_db(result){
    var hits = result.hits.hits;  // the detailed query result

    var disp_content = "<table><tr><th>No.</th><th>Database</th><th>Content</th></tr>";
    for(var i = 0; i < hits.length; i++){
        disp_content += "<tr><td align='center'>" + i + "</td>";
        disp_content += "<td align='center'>" + hits[i]._source.type + "</td>";
        disp_content += "<td align='center'>";
        for(var j in hits[i]._source){
            disp_content += "<b>" + j + ':' + "</b>" + hits[i]._source[j] + '|';
        }
        disp_content += "</td></tr>";
    }
    disp_content += "</table>";

    return disp_content;
}

exports.disp_overview = disp_overview;
exports.disp_detail = disp_detail;
exports.disp_db = disp_db;