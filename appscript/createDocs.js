// For app script, the variables must be declared in the same gs file
// Perhaps due to length of KEY, storing these variables are Project Properties did not work either
// FYI Project Properties worked with shorter strings.
var serviceAc = {
        EMAIL: "appointment-synchronization@newbot-a9161.iam.gserviceaccount.com",
        KEY: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCp6C4rFg4zKjAb\ni7pQm+MnWUHNS9Pnx7SIvro35Ka8olmIjbEbd7cxIWEM8+Yo8dyD8YFk3biYwPHq\njHd0AO/VXhhxcyJgwrSoRFD3Gbq/K+nmor30dW7BXQFoGhUso0mX3ih4AuzkAsfx\n5YTZjBtSBF8PxkiLn+xrJCFpnHMfRa4yHxAhkYdO676PouLeTeMUpLp9VB6kT+KE\nWV82IPQZjjIujVVwKggxSjLNrQVyLNws4nIRNtG5s7hwPgLLENps8Il3QIlJ21cM\n/815uiYbI6hDsH8WLryRLlzQqBRBHxyrAxb4O2lL33PNeC5IFMCO7WdEkNdv52yZ\n5I2LCeUPAgMBAAECggEAD8c18l5b9zhlu0kghjfTwmWxjKUMCqwrAb/kfyhGq6HP\n+rRdzBUz9+YHozJLH2ZGeiJFR96nM9hHHuboeOdVXlUco/xzJtUt/apKcof7JaGo\nWPin9zmojWBbrxUs/jYzsVy6GVr8MLhpZPdRfPpb1yP8x/Q77GtvgwuZ5rrWngKt\nnYWxYhg4ndQXtIGek9gcxhpjfa6gHspiMD+RT9e8Q8d+vwc9M+FgZHyivSe3vxEE\nmFPG4s1KDnqExJbdrKsQPmkZMS0rwcdUwbgfq53pyDi51RCQ6CxVjETM9TMmrSjD\nkihBXNNjFZJM3SVGYp3PUS4zFXRCR0X+fLBAxi61AQKBgQDl0sK6pDVcNJuRhhZu\nTPglyVOkYvO2r4k0msD12DtyYnRyUSAHEeWAtGNQDa1miFIrd0C3i9BeKk/vHaR7\nxSeHpxE8hue7XaOYVPEGEfkuOoeucARS3jLDsfArFdrCLC+vdQxrL3VbJo1QnFDt\nQwAPAOlt0xF+s87CygjTT5sZTwKBgQC9Ql2kU3sudz6HXXPCqR0uBBiR2gOfKxns\npSA2PffXi7Ntpn4JrFBLrdIjiXb1szkuAL3xxL2n0CTOffDXN1jsE0wYGGBWK1oL\n52JtZldUU+09pHXT2ozvgi7qY7m5YJbkzSXjArS6kR0z9OmGLV6k+mRflrWev55E\nk+2rUsIIQQKBgQDkdYrV9n6E1lb/ZofNxf23slbPRv52UDDYdi3zNayCnJSdPz/T\nR1sZgjhnT/Fbx4/HXZib3QSZVv52+MSVtPsCwnVD8edSPlduCqI+IofOCKjwIrJp\nnjBgkPXqHqOD+mC8zmI1+styfPRleb6I3N2mDIX/gp4VkbCruiLjzHKlyQKBgQCs\nRqUG2BbhDRqWDbM6FsbBBGl5GoMBeDJ4/zZ7KZ1ZT4lc3pkMJRZSTT9jqdXngeUi\nwvokAXrCLu3SKUH6Jh+DhW1W4ZmP1pZ5D37BJs+Hq33hBrtaxS5VNqOOKIj+/bVd\nQICkS+pHiaCTkvSfdt0YP/TuLjnU74gZ1K4brZGCAQKBgBr4kG1AD1ylfDmdykZ+\nI/57cLOlLQiXKD4Z2Uc6/8gOvqFn4uY/C5NQLpb5IwJO0vR/R5KlRj4XRf43cHCH\nj5LnxIJoOIr9iVEPkkIQU7di7qqF7LbFzXtXJEiIpHM+gNplGkNdjq8XmN7zq2Vj\nPwe4e8+BVPx/Kav5CzTH5RMa\n-----END PRIVATE KEY-----\n"
};
var parentURL = "https://firestore.googleapis.com/v1beta1/projects/newbot-a9161/databases/(default)/documents/";
var colHeadings = ["NRIC", "Course", "Matriculation No", "Name", "Timeslot"];
var colHeadingsMap = {"docId":0, "course_name":1, "matriculation_no":2, "name":3, "slot":4};

function base64EncodeSafe(string) {
  var encoded = Utilities.base64EncodeWebSafe(string);
  return encoded.replace(/=/g, "");
}

function createJwt(email, key) {
  const jwtHeader = {"alg" : "RS256", "typ" : "JWT"};
  
  const now = new Date();
  const nowSeconds = now.getTime() / 1000;
  
  now.setHours(now.getHours() + 1);
  const oneHourFromNowSeconds = now.getTime() / 1000;
  
  const jwtClaim = {
    "iss" : email,
    "scope" : "https://www.googleapis.com/auth/datastore",
    "aud" : "https://www.googleapis.com/oauth2/v4/token/",
    "exp" : oneHourFromNowSeconds,
    "iat" : nowSeconds
  }
  
  const jwtHeaderBase64 = base64EncodeSafe(JSON.stringify(jwtHeader));  
  const jwtClaimBase64 = base64EncodeSafe(JSON.stringify(jwtClaim));
  
  const signatureInput = jwtHeaderBase64 + "." + jwtClaimBase64;
  const signature = Utilities.computeRsaSha256Signature(signatureInput, key);
  
  const encodedSignature = base64EncodeSafe(signature);
  const jwt = signatureInput + "." + encodedSignature;
        
  return jwt;
}

function getAuthToken(email, key) {
  const jwt = createJwt(email, key);
  Logger.log (JSON.stringify(jwt));
  const options = {
   'method' : 'post',
   'payload' : 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt,
   'muteHttpExceptions' : true
  };
  
  const response = UrlFetchApp.fetch("https://www.googleapis.com/oauth2/v4/token/", options)
  const responseObj = JSON.parse(response.getContentText())
  
  return responseObj["access_token"];
}

function wrapTimeStamp(timestamp) {
  return {"timestampValue" : timestamp};
}

function wrapString(string) {
  return {"stringValue" : string};
}

function wrapBoolean(boolean) {
  return {"booleanValue" : boolean};
}

function wrapInt(int) {
  return {"integerValue" : int};
}

function wrapDouble(double) {
  return {"doubleValue" : double};
}

function wrapNumber(num) {
  if (parseInt(num)) {
    return wrapInt(num);
  } else {
    return wrapDouble(num);           
  }
}

function wrapObject(object) {
  if (!object) {
    return {"nullValue" : null};
  }
  
  // `createFirestoreObject(object)` is calling a function we will write next. Read on!
  return {"mapValue" : createFirestoreObject(object)};
}

function createFirestoreObject(objToInsertUpdate) {

  Logger.log ("objToInsertUpdate -> " + objToInsertUpdate + " " + typeof(objToInsertUpdate));

  keys = [];
  const keys = Object.keys(objToInsertUpdate);
  const firestoreObj = {};
    
  firestoreObj["fields"] = {};
    
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var val = objToInsertUpdate[key];
    var type = typeof(val);
    
    var dt = Date.parse(val);
    if (isNaN(dt) == false) {
      Logger.log ("Is a ts!" + dt);
      type = "timestamp" // cannot leave it as object
    }
    
    switch(type) {
      case "string":
        firestoreObj["fields"][key] = wrapString(val);
        break;
      case "object":
        firestoreObj["fields"][key] = wrapObject(val);
        break;
      case "number":
        firestoreObj["fields"][key] = wrapNumber(val);
        break;
      case "boolean":
        firestoreObj["fields"][key] = wrapBoolean(val);
        break;
      case "timestamp":
        firestoreObj["fields"][key] = wrapTimeStamp(val);
        break;
      default:
        break;
    }
  }
  Logger.log ("The obj " + JSON.stringify(firestoreObj));
  return firestoreObj;
}

function createStudent(path, documentId, studentData) {
  const token = getAuthToken(serviceAc.EMAIL, serviceAc.KEY);
  Logger.log ("Auth Token " + token);
  
  Logger.log ("studentData " + studentData);
  const firestoreObject = createFirestoreObject(studentData);
  const baseUrl = parentURL + path + "/" + documentId +"?updateMask.fieldPaths=course_name" +
  "&updateMask.fieldPaths=matriculation_no&updateMask.fieldPaths=name&updateMask.fieldPaths=slot";
  
  const options = {
   'method' : 'patch',
   'muteHttpExceptions' : true,
   'payload': JSON.stringify(firestoreObject),
   'headers': {'content-type': 'application/json', 'Authorization': 'Bearer ' + token}
  };
  
  Logger.log (baseUrl);
  return UrlFetchApp.fetch(baseUrl, options);  
}

function createTimeSlot(path, documentId, timeSlotData) {
  const token = getAuthToken(serviceAc.EMAIL, serviceAc.KEY);
  Logger.log ("Auth Token " + token);
  
  Logger.log ("timeSlotData " + timeSlotData);
  const firestoreObject = createFirestoreObject(timeSlotData);
  const baseUrl = parentURL + path + "/" + documentId +
  "?updateMask.fieldPaths=from&updateMask.fieldPaths=max&updateMask.fieldPaths=to&updateMask.fieldPaths=venue";
  
  const options = {
   'method' : 'patch',
   'muteHttpExceptions' : true,
   'payload': JSON.stringify(firestoreObject),
   'headers': {'content-type': 'application/json', 'Authorization': 'Bearer ' + token}
  };
  
  Logger.log (baseUrl);
  return UrlFetchApp.fetch(baseUrl, options);
}

var apptTestData = {
   'course_name' : 'Diploma in Information Technology',
   'matriculation_no' : '14001002',
   'name' : 'Amanda-Brenda Chong Dae Eon',
   'slot' : '10:30 AM'
};

function createOneTestSlot() {
  var timeSlotTestData = {
  'from' : '2019-10-06T15:00:00+08:00',
  'max' : 100,
  'to' : '2019-10-06T15:30:00+08:00',
  'venue' : 'RPC Rm 888'
  };
  response = createTimeSlot('timeslot', '06-Oct-19 03:00 PM', timeSlotTestData);
  Logger.log("Result: " + response.getResponseCode());
}

function validateId (Id) {
  Id = Id.trim();
  if (Id.length !== 18) {
    return false;
  }
  patt=/(01|02|03|04|05|06|07|08|09|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31)-(Jan|Feb|Mar|Apr|Mar|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(18|19|20|21|22|23) (00|01|02|03|04|05|06|07|08|09|10|11|12):(00|01|02|03|04|05|06|07|08|09|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32|33|34|35|36|37|38|39|40|41|42|43|44|45|46|47|48|49|50|51|52|53|54|55|56|57|58|59) (AM|PM)/;
  var result = Id.match(patt);
  if (!result) {
    return false;
  }
  return true;
}

function uploadEligibleStudents () {
  var response = SpreadsheetApp.getUi().alert('Upload Student Information?', SpreadsheetApp.getUi().ButtonSet.YES_NO);
  if (response == SpreadsheetApp.getUi().Button.NO)
    return;
   
  var sheetName = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Utilities').getRange('A14:A14').getValues();
  var studentInfoSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var values = studentInfoSheet.getDataRange().getValues();
  var logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Logs');
  var successCount = 0;
  if (logSheet == null) {
    SpreadsheetApp.getActiveSpreadsheet().insertSheet('Logs');
    logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Logs');
  }
  logSheet.appendRow([" "]);
  logSheet.appendRow(["START: Upload Students Information from  " + sheetName,
  Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM-yyyy HH:mm")]);
  
  for (var i = 1; i < values.length; i++) { // start with 1 to discard header rows
   var row = "", rowNoErr = true, studentData = {}, studentNRIC = "";
   for (var j = 0; j < values[i].length; j++) {
     Logger.log("Checking Row " + i + " Col " + j + ":" + values[i][j] + " " + typeof (values[i][j]));
     if (values[i][0]) { // the first column is populated
       switch (values[0][j]) {
         case "NRIC":
           studentNRIC = values[i][j].slice(0,1) + "XXX" + values[i][j].slice(4,9);
           break;
           
         case "Timeslot":
           if (values[i][j].trim().length !== 0) {
             if (!validateId(values[i][j])) {
               Logger.log("E R R O R  ! at Row " + i + " Col " + j + ": Invalid Date/Time Format " + values[i][j]);
               rowNoErr = false;
               logSheet.appendRow(["E R R O R  ! at Row " + i + " Col " + j + ": Invalid Date/Time Format " + values[i][j],
               Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM-yyyy HH:mm")]);
             } else {
               studentData.slot = values[i][j];
             }
           } else {
             studentData.slot = "";
           }
           break;
           
         case "Course":
           studentData.course_name = values[i][j];
           break;
         case "Matriculation No":
           studentData.matriculation_no = values[i][j];
           break;
         case "Name":
           studentData.name = values[i][j];
           break;
       }
       row = row + values[i][j];
     }
     row = row + ",";
   }
   if (rowNoErr) {
     Logger.log("Inserting Row " + i + " " + studentNRIC + " " + JSON.stringify(studentData));
     response = createStudent('TESTappts', studentNRIC, studentData);
     Logger.log("Result: " + response.getResponseCode());
     if (response.getResponseCode() == 200) {
       successCount++;
     }
   }
 }
 i--; // just to display the correct total
 logSheet.appendRow(["END: Upload Students Information from tab " + sheetName + ". Sucess: " + successCount + " of " + i +
 ". ", Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM-yyyy HH:mm")]);
 SpreadsheetApp.getUi().alert ("Upload Attempt Completed. "+ successCount + " of " + i + 
 ". Please verify uploaded contents and check logs for errors");
}

function uploadTimeslots () {
  var response = SpreadsheetApp.getUi().alert('Upload Time Slots?', SpreadsheetApp.getUi().ButtonSet.YES_NO);
  if (response == SpreadsheetApp.getUi().Button.NO)
    return;
   
  var sheetName = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Utilities').getRange('A2:A2').getValues();
  var timeslotSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var values = timeslotSheet.getDataRange().getValues();
  var logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Logs');
  var successCount = 0;
  if (logSheet == null) {
    SpreadsheetApp.getActiveSpreadsheet().insertSheet('Logs');
    logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Logs');
  }
  logSheet.appendRow([" "]);
  logSheet.appendRow(["START: Upload Time Timeslot Master from  " + sheetName,
  Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM-yyyy HH:mm")]);
  
  for (var i = 1; i < values.length; i++) { // start with 1 to discard header rows
   var row = "", rowNoErr = true, timeSlotData = {}, timeSlotId = "";
   for (var j = 0; j < values[i].length; j++) {
     Logger.log("Checking Row " + i + " Col " + j + ":" + values[i][j] + " " + typeof (values[i][j]));
     if (values[i][j]) {
       switch (values[0][j]) {
         case "Id":
           if (!validateId(values[i][j])) {
             Logger.log("E R R O R  ! at Row " + i + " Col " + j + ": Invalid Date/Time Format " + values[i][j]);
             rowNoErr = false;
             logSheet.appendRow(["E R R O R  ! at Row " + i + " Col " + j + ": Invalid Date/Time Format " + values[i][j],
             Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM-yyyy HH:mm")]);
           } else {
             timeSlotId = values[i][j];
           }
           break;
           
         case "From":
         case "To":
           var someDate = new Date(values[i][j]);
           if (someDate == "Invalid Date") {
             Logger.log("E R R O R  ! Row " + i + " Col " + j + ": Invalid Date/Time " + values[i][j]);
             rowNoErr = false;
             logSheet.appendRow(["E R R O R  ! at Row " + i + " Col " + j + ": Invalid Date/Time " + values[i][j],
             Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM-yyyy HH:mm")]);
           } else {
             if (values[0][j] == "From")
               timeSlotData.from = values[i][j];
             else if (values[0][j] == "To")
               timeSlotData.to = values[i][j];
           }
           break;
           
         case "Max":
           if (isNaN(values[i][j])) {
             Logger.log("E R R O R  ! Row " + i + " Col " + j + ": Invalid Number " + values[i][j]);
             rowNoErr = false;
             logSheet.appendRow(["E R R O R  ! at Row " + i + " Col " + j + ": Invalid Number " + values[i][j],
             Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM-yyyy HH:mm")]);
           } else
             timeSlotData.max = values[i][j];
           break;
           
         case "Venue":
           timeSlotData.venue = values[i][j];
       }
       row = row + values[i][j];
     }
     row = row + ",";
   }
   if (rowNoErr) {
     Logger.log("Inserting Row " + i + " " + timeSlotId + " " + JSON.stringify(timeSlotData));
     response = createTimeSlot('TESTtimeslot', timeSlotId, timeSlotData);
     Logger.log("Result: " + response.getResponseCode());
     if (response.getResponseCode() == 200) {
       successCount++;
     }
   }
 }
 i--; // just to display the correct total
 logSheet.appendRow(["END: Upload Time Timeslot Master from tab " + sheetName + ". Sucess: " + successCount + " of " + i +
 ". ", Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM-yyyy HH:mm")]);
 SpreadsheetApp.getUi().alert ("Upload Attempt Completed. "+ successCount + " of " + i + 
 ". Please verify uploaded contents and check logs for errors");
}

function downloadAppts () {
  var response = SpreadsheetApp.getUi().alert('Download Student Appointment Information?', SpreadsheetApp.getUi().ButtonSet.YES_NO);
  if (response == SpreadsheetApp.getUi().Button.NO)
    return;
   
  var sheetName = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Utilities').getRange('C14:C14').getValues();
  var studentInfoSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName[0][0]);
  if (studentInfoSheet == null) {
    SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName[0][0]);
    studentInfoSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName[0][0]);
  }
  var logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Logs');
  var successCount = 0;
  if (logSheet == null) {
    SpreadsheetApp.getActiveSpreadsheet().insertSheet('Logs');
    logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Logs');
  }
  logSheet.appendRow([" "]);
  logSheet.appendRow(["START: Download Students Information from FIRESTORE to " + sheetName,
  Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM-yyyy HH:mm")]);
  
  const token = getAuthToken(serviceAc.EMAIL, serviceAc.KEY);
  Logger.log ("Auth Token " + token);
  
  const baseUrl = parentURL + "TESTappts";
  const options = {
   'method' : 'get',
   'muteHttpExceptions' : true,
   'payload': "",
   'headers': {'content-type': 'application/json', 'Authorization': 'Bearer ' + token}
  };
  Logger.log (baseUrl);
  response = UrlFetchApp.fetch(baseUrl, options);
  if (response.getResponseCode() == 200) {
    Logger.log(response.getContentText());
    var resultSet = JSON.parse(response.getContentText());
    Logger.log(resultSet);
    for (var i = 0; i < resultSet.documents.length; i++) {
      if (studentInfoSheet.getLastRow() == 0 ) {
        studentInfoSheet.appendRow(colHeadings);
      }
      var currRow=[];
      var docNameComponents = resultSet.documents[i].name.split('/');
      var currIcNo = docNameComponents[docNameComponents.length-1];
      currRow[colHeadingsMap["docId"]] = currIcNo;
      // assume that fields WILL NOT contain deeper objects
      // The structure is as follows, e.g.:
      /*  "documents": [
            {
             "name": "projects/newbot-a9161/databases/(default)/documents/TESTappts/GXXX8777S",
             "fields": {
              "matriculation_no": {
              "stringValue": "18098376"
              }, more "fields" occurences ....... */
      var fieldKeys = Object.keys(resultSet.documents[i].fields);
      var currField = "";
      var colNo = 0;
      for (var j = 0; j < fieldKeys.length; j++) {
        var dataTypeKey = Object.keys(resultSet.documents[i].fields[fieldKeys[j]]);
        Logger.log("Curr Field: " + resultSet.documents[i].fields[fieldKeys[j]][dataTypeKey[0]]);
        currField = resultSet.documents[i].fields[fieldKeys[j]][dataTypeKey[0]];
        colNo = colHeadingsMap[fieldKeys[j]];
        currRow[colNo] = currField;
      }
      Logger.log("Curr Row :" + currRow);
      studentInfoSheet.appendRow(currRow);
    }
    logSheet.appendRow(["END: Completed download Student Appointment Information. Total " +
    resultSet.documents.length + " rows", 
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM-yyyy HH:mm")]);
  } else {
    logSheet.appendRow(["END: Unable to download Student Appointment Information",
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM-yyyy HH:mm")]);
  }
}