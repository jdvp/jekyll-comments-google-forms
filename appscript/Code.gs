var COMMENT_FORM_ID = ""; //TODO
var COMMENT_SHEET_ID = ""; //TODO
var RECAPTCHA_SECRET_KEY = ""; //TODO
var RECAPTCHA_THRESHOLD = .4;

function doGet(req) {
  var url = req?.parameter?.url || null

  if (url == null) {
    return getError("Required URL Parameter is null");
  }

  var sh = SpreadsheetApp.openById(COMMENT_SHEET_ID)
  
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

  var form = FormApp.openById(COMMENT_FORM_ID);
  var formItems = form.getItems();
  var nameItem = formItems.find(item => item.getTitle().toUpperCase().includes("name".toUpperCase())) || null;
  var urlItem = formItems.find(item => item.getTitle().toUpperCase().includes("article url".toUpperCase())) || null;
  var commentItem = formItems.find(item => item.getTitle().toUpperCase().includes("comment".toUpperCase())) || null;

  if (nameItem == null) {
    return getError("Google Form appears to be misisng the 'Name' field");
  }
  if (urlItem == null) {
    return getError("Google Form appears to be missing the 'Article Url' field");
  }
  if (commentItem == null) {
    return getError("Google Form appeaers to be misisng the 'Comment' field");
  }

  var response = form.createResponse();
  response.withItemResponse(nameItem.asTextItem().createResponse(name));
  response.withItemResponse(urlItem.asTextItem().createResponse(url));
  response.withItemResponse(commentItem.asParagraphTextItem().createResponse(comment));

  try {
    response.submit();
    return doGet({ parameter : { url : url }});
  } catch {
    return getError("Submission failed, please try again in a bit.");
  }
}