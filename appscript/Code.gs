var COMMENT_FORM_ID = ""; //TODO
var COMMENT_SHEET_ID = ""; //TODO

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
    return getError("Can't find timestamp column in Google Sheet");
  }
  if (columnUrl < 0) {
    return getError("Can't find url column in Google Sheet");
  }
  if (columnName < 0) {
    return getError("Can't find name column in Google Sheet");
  }
  if (columnComment < 0) {
    return getError("Can't find comment column in Google Sheet");
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

  var url = bodyData?.url || null;
  var name = bodyData?.name || null;
  var comment = bodyData?.comment || null;
  
  console.info("url is "+ url);
  console.info("name is "+ name);
  console.info("comment is "+ comment);
  Logger.log("url is "+ url);
  Logger.log("name is "+ name);
  Logger.log("comment is "+ comment);

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