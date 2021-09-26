/**
 * @OnlyCurrentDoc
 */

var RECAPTCHA_SECRET_KEY = ""; //TODO add this if using RECAPTCHA
var RECAPTCHA_THRESHOLD = .4;

function doGet(req) {
  var url = req?.parameter?.url || null;

  if (url == null) {
    return getError("Required URL Parameter is null");
  }

  var sh = SpreadsheetApp.getActiveSheet();
  
  var headers = sh.getSheetValues(1, 1, 1, sh.getLastColumn())[0];
  var columnTimestamp = headers.findIndex(element => "timestamp".toUpperCase() === element.toUpperCase());
  var columnUrl = headers.findIndex(element => element.toUpperCase().includes("url".toUpperCase()));
  var columnName = headers.findIndex(element => "name".toUpperCase() === element.toUpperCase());
  var columnComment = headers.findIndex(element => "comment".toUpperCase() === element.toUpperCase());
  var columnIsAuthor = headers.findIndex(element => "isAuthor".toUpperCase() === element.toUpperCase());

  /* Ensure required rows are there, technically isAuthor is not required, so we don't check for it at this point */
  if (columnTimestamp < 0) {
    return getError("Can't find 'timestamp' column in Google Sheet");
  }
  if (columnUrl < 0) {
    return getError("Can't find 'article url' column in Google Sheet");
  }
  if (columnName < 0) {
    return getError("Can't find 'name' column in Google Sheet");
  }
  if (columnComment < 0) {
    return getError("Can't find 'comment' column in Google Sheet");
  }

  var numRows = sh.getLastRow() - 1;
  if (numRows == 0) {
    return ContentService
    .createTextOutput(JSON.stringify([]))
    .setMimeType(ContentService.MimeType.JSON);
  }

  var values = sh.getSheetValues(2, 1, sh.getLastRow() - 1, sh.getLastColumn())
    .sort((a, b) => a[columnTimestamp] - b[columnTimestamp])
    .filter(element => (element[columnTimestamp] || 0) != 0)
    .filter(element => element[columnUrl] == url);

  var data = values.map(element => {
    return {
      "timestamp" : element[columnTimestamp] || 0,
      "name" : element[columnName] || "",
      "comment" : element[columnComment] || "",
      "isAuthor" : element[columnIsAuthor] || false
    }
  })

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getError(errorText) {
  return ContentService
    .createTextOutput(JSON.stringify({
      "error": errorText
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(req) {
  var bodyData = JSON.parse(req?.postData?.contents || "{}")

  /* TODO uncomment this if using recaptcha and want server-side validation

  var recaptchaToken = bodyData?.recaptchaToken || null;
  if (recaptchaToken == null) {
    return getError("POST body missing required 'recaptchaToken' paramter (which must also be non-empty)");
  }

  var formData = {
    "secret": RECAPTCHA_SECRET_KEY,
    "response": recaptchaToken
  };
  var options = {
    "method" : "post",
    "payload" : formData
  };
  try {
    var recaptchaResponse = JSON.parse(UrlFetchApp.fetch("https://www.google.com/recaptcha/api/siteverify", options).getContentText());
    var sucess = recaptchaResponse.success || false;
    if (!sucess) {
      return getError("reCAPTCHA is required but appears to be misconfigured on the site")
    }
    var score = recaptchaResponse.score || 0;
    if (score < RECAPTCHA_THRESHOLD) {
      return getError("reCAPTCHA suspects bot behavior, please try again in a bit")
    }
  } catch {
    return getError("reCAPTCHA could not be verified");
  }
  */

  var url = bodyData?.url || null;
  var name = bodyData?.name || null;
  var comment = bodyData?.comment || null;

  if (url == null || url == "") {
    return getError("POST body missing required 'url' paramter (which must also be non-empty)");
  }
  if (name == null || name == "") {
    return getError("POST body missing required 'name' paramter (which must also be non-empty)");
  }
  if (comment == null || comment == "") {
    return getError("POST body missing required 'comment' paramter (which must also be non-empty)");
  }

  var sh = SpreadsheetApp.getActiveSheet();
  var headers = sh.getSheetValues(1, 1, 1, sh.getLastColumn())[0];
  var columnTimestamp = headers.findIndex(element => "timestamp".toUpperCase() === element.toUpperCase());
  var columnUrl = headers.findIndex(element => element.toUpperCase().includes("url".toUpperCase()));
  var columnName = headers.findIndex(element => "name".toUpperCase() === element.toUpperCase());
  var columnComment = headers.findIndex(element => "comment".toUpperCase() === element.toUpperCase());

  /* Ensure required rows are there, technically isAuthor is not required, so we don't check for it at this point */
  if (columnTimestamp < 0) {
    return getError("Can't find 'timestamp' column in Google Sheet");
  }
  if (columnUrl < 0) {
    return getError("Can't find 'article url' column in Google Sheet");
  }
  if (columnName < 0) {
    return getError("Can't find 'name' column in Google Sheet");
  }
  if (columnComment < 0) {
    return getError("Can't find 'comment' column in Google Sheet");
  }

  var newRow = [];

  for (let i = 0; i < sh.getLastColumn(); i++) {
    switch(i) {
      case columnTimestamp:
        newRow.push(new Date());
        break;
      case columnUrl:
        newRow.push(url);
        break;
      case columnName:
        newRow.push(name);
        break;
      case columnComment:
        newRow.push(comment);
        break;
      default:
        newRow.push(null);
    }
  }

  try {
    sh.appendRow(newRow);
    return doGet({ parameter : { url : url }});
  } catch {
    return getError("Submission failed, please try again in a bit.");
  }
}

/**
 * Function used in Apps Script Editor to test functionality
 * and grant permissions. If you want to validate output, you
 * can change the url parameter below
 */
function testGetComments() {
  var results = doGet({ parameter : { url : "test-url"}}).getContent();
  Logger.log("doGet results:")
  Logger.log(results);
}

/**
 * Function used in Apps Script Editor to test functionality
 * and grant permissions. If you want to validate output, you
 * can change the url, name, and comment parameters below
 */
function testPostComment() {
  var testResponse = {
    postData : {
      contents : JSON.stringify({
        url : "test-url",
        name: "test-name",
        comment: "test-comment"
      })
    }
  }
  var results = doPost(testResponse).getContent();
  Logger.log("doPost results:")
  Logger.log(results);
}