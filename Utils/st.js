  function getCardHeader(text) {
    var html = '<div class="card">'
    html += '<div class="btn-group">'
    html += '<div class="card-header">'
    html += '<label class="form-check-label">' + text + '</label>'
    return html
  }
  function getCardFooter() {
    var html = '</div>'
        html += '</div>'
        html += '</div>'
    return html
  }
  function getCardFooterUpload(func, attr, text, tid) {
    var html = '<button type="button" class="btn btn-warning" id="' + tid + '" onclick="' + func + '(' + attr + ')">' + text + '</button>'
        html += getCardFooter();
    return html
  }
  function getCardInput(ttype, tid, tfor, ttext) {
    var html = '<div class="form-check-inline">'
    html += '<label class="form-check-label" for="' + tfor + '">'
    html += '<input type="' + ttype + '" class="form-check-input" id="' + tid + '" name="' + tfor + '">' + ttext 
    html += '</label>'
    html += '</div>'
    return html
  }
  function addBody() {
    if (document.getElementById("testdiv")) {
        var html = '';
        html += '<div id="statisticsSection">'
        html += '<div class="card">'
        html += '<label class="form-check-label" id="title"></label>'
        html += '</div></div>'

        html += '<div id="chrSection">'
        html += getCardHeader("Chr&nbsp&nbsp&nbsp&nbsp")
        _.each(chrs, function(ch) {
          html += getCardInput("radio", "chr" + ch, "checkC", ch)
        });
        html += getCardFooterUpload("uploadChr", "\'upload chr\'", "Upload chr", "upload-chr")
        html += '</div>'

        html += '<div id="tissueSection">'
        html += getCardHeader("Tissue&nbsp")
        _.each(tissues, function(t) {
          html += getCardInput("checkbox", "tissue" + t, "checkT", t)
        });
        html += getCardFooterUpload("output", "\'upload tissue\'", "Upload tissue", "upload-tissue")
        html += '</div>'
        
        html += '<div id="graphSection">'
        html += getCardHeader("&nbsp&nbsp&nbsp")
        html += getCardInput("checkbox", "freeze-layout", "checkF", "freeze layout")
        html += getCardFooterUpload("uploadSettings", "\'UploadGraph\'", "Upload settings", "upload-settings")
        html += '<div class="card-body" id="mynetwork"></div>'
        html += '<div class="card-footer" id="networkinfo">Footer</div>'
        html += '</div>'

        html += ''
        $("#testcard").append(html);
    }
  }
  function hideSection(sid) {
    if (document.getElementById(sid)) {
      $("#" + sid).hide()
    }
  }
  function showSection(sid) {
    if (document.getElementById(sid)) {
      $("#" + sid).show()
    }
  }
  function changeText(sid, text) {
    if (document.getElementById(sid)) {
      // console.log("old text", document.getElementById(sid).textContent)
      document.getElementById(sid).innerText = text;
      // console.log("new text", document.getElementById(sid).textContent)
    }
  }
  function checkedChr() {
    var rc = [];
    _.each(chrs, function(ch) { if (document.getElementById('chr' + ch).checked) rc.push(ch); });
    return rc;
  }
  function checkedTissues() {
    var rc = [];
    _.each(tissues, function(t) { if (document.getElementById('tissue' + t).checked) rc.push(t); });
    return rc;
  }
  function uploadChr() {
    var sid = "upload-chr"
    if (document.getElementById(sid)) {
      // console.log("uploadChr", document.getElementById(sid).textContent, $('[for="checkC"]'))
      if (document.getElementById(sid).textContent === "Upload chr") {
        if (chrsdata !== undefined && _.size(checkedChr()) > 0 && _.size(checkedTissues()) > 0) {
            document.getElementById(sid).innerText = "Change chr";
            showSection("graphSection")
            document.getElementById('freeze-layout').checked = false;
            _.each(chrs, function(ch) { document.getElementById('chr' + ch).disabled = true; });
            _.each(tissues, function(t) { 
              var elem = document.getElementById('tissue' + t);
              elem.disabled = elem.checked; 
            });
            settings = {
              freeze_layout: false,
              checked_chr: checkedChr(),
              checked_tissues: checkedTissues(),
            }
            alldata = chrsdata[settings.checked_chr];
            uploadGraph();
            setTitle();
        }
      }
      else {
        document.getElementById(sid).innerText = "Upload chr";
        hideSection("graphSection")
        _.each(chrs, function(c) { document.getElementById('chr' + c).disabled = false; });
        _.each(tissues, function(t) { document.getElementById('tissue' + t).disabled = false; });
        var elem = document.getElementById("title");
        elem.innerHTML = "";
      }
    }
  }
  function uploadSettings() {
    var elem;
    var sid = "upload-settings"
    if (document.getElementById(sid)) {
      elem = document.getElementById('freeze-layout');
      if (elem.checked !== settings.freeze_layout) {
        settings.freeze_layout = !settings.freeze_layout;
      }
      settings.checked_tissues = checkedTissues();
      freezeNetwork(settings.freeze_layout)
    }
    updateEdges();
  }