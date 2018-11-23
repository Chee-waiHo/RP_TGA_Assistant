// For app script, the variables must be declared in the same gs file
// Perhaps due to length of KEY, storing these variables are Project Properties did not work either
// FYI Project Properties worked with shorter strings.
var serviceAc = {
        EMAIL: "test-536@rp-tga-assistant-test.iam.gserviceaccount.com",
        KEY: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCQ+YktoQJ4W3kp\nkyP9cSOlPmkKVRCYv33+pEURe4qz63wknhflXwxHLComYPsneAEDV5CPBsZ0Ebie\n3Wetd23dVIRfOOJ5yJEl/1aGb4pS46ZxQUC+E7jcHGHsjtJXqdQCK1EHoVsZ/8U/\nSeaT2dgRY3gog/j5VLimjzfL4Hz65LG4behoQn1W6lB2ISG/3jiShnadTeqOrRgv\nVRo6V4/nyESnt1X33aKuCt/Cpy+fw9Fv+JERPvlyUwm/KGIVE/dVz7xMaXmtDf8H\nDuxquOubsb1EAm4H+C+1rR1gqoIOTSuvafxIJ8JNmeRg0YMvdWsevdiWonBXbyXO\nze/XmarPAgMBAAECggEARs0/hAPCx5Hw6e98361OGckRlqS1nsvClkaWnrOlqTnj\n3qRBClmxjt7QVP7/Gab/Y6jzpg5KhGwVLKz3kd2mT7YTkcefv5dG3/ZERRKbTOD2\nLBCQtGPAX+sSneugaYS80DRkdeQFMHzb0Y1faSy2W8Om7q6JPQd1yI5gUxb3IrYq\nsxW9AewOZ47RIbrdwLCs/sD5XkY7U490oe7I8eXc8EzuxBRgLRrdVVD5h4tRpEdY\nceeD3TJuFS4NGl1+MjM4128N8aniULLK5e30i7c2jZs8WjEd4r0Vx0JoyWnUup4R\nDClajC6kCXqJ3tQMF8S5Rd6O1fyauG3co+CEnxEtlQKBgQDBYZp+FmvelF3+6hLk\nBx4WUoOMW2IAbjvOwYoZ8givS/Q3TwssbsWKayrlWKeOCrMvrG9O3w+0ZeoIugde\nqwSuKrPEO7HbGxWJPWHzWcj9rKLHXXEMQi6kS/gvMBvFOmPIPux/VFd/s3mQTx+l\nZnRKd5f686IPST5B0B5oglqVJQKBgQC/60KbpPYB1b0LCoGGnETVVpZIvowkJgsK\nxDldGR+MXVBl+e03CXSqGicY0t/dOK0Dq4BZqVyxusH3t/W5w4KcLJ4my0feyuDM\n1hox5rhAJot7zEwnxgcILkoRWROOt7HuLWqmdrOQcf5rpTizGGbYuAKE8UAEO+i2\ndEbJMu1P4wKBgFM+I5XRKv/2F/wqYJVd5vqu7EeX8rjCuuYGc981S73B0U+Zq/Kl\ngE1UUnPFVOMVAgssjAGEjasXD8ZP5eo/bdVXNmjrVWU+5GdeT/LEHHvuO2fcdlRT\njOZWeXA+okWlG9zQEVfCQ6QJ6vNOzA2T680+a+Kvy3wPCEimQOC19C4tAoGBAK+J\nmC/STyzYeYNqxZQAxLi47NZ2aqn5nenoFmu/uephw1KyqTTI0ktvhkkfP6EQ4LbV\nm5zm2qC5KAbS3M9fMsxzxufG0OLHf5v7TJRN6kLKvpOqBhHu/6mM5TQ+3DOScw1d\nvwmo0o6QpVuCEH1HGXKpw6wjGSGGRlDzw3btvL9vAoGAeICsILMt10uBZhGbG456\n7/PexCME5q5JGdlJOTGbJyKZqUeOBIybUf4JQJsXUd5WbHirfwR9SE3Kpf6K/jWG\nixImLsb9tafz7KXxhtQpIVetxwS2e2lNy8WPpWmrm9PaT/IrP3hOfNXAnsryGlid\n/PoZIaoT0N0ihHUCc3h3Y04=\n-----END PRIVATE KEY-----\n"
};
var parentURL = "https://firestore.googleapis.com/v1beta1/projects/rp-tga-assistant-test/databases/(default)/documents/";
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
  patt=/(01|02|03|04|05|06|07|08|09|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(18|19|20|21|22|23) (00|01|02|03|04|05|06|07|08|09|10|11|12):(00|01|02|03|04|05|06|07|08|09|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32|33|34|35|36|37|38|39|40|41|42|43|44|45|46|47|48|49|50|51|52|53|54|55|56|57|58|59) (AM|PM)/;
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
             values[i][j] = values[i][j].replace(/_/g, ""); // if not do this, always invalid!
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
     response = createStudent('appts', studentNRIC, studentData);
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
     response = createTimeSlot('timeslot', timeSlotId, timeSlotData);
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
  var nextPageToken = "First Fetch";
  if (logSheet == null) {
    SpreadsheetApp.getActiveSpreadsheet().insertSheet('Logs');
    logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Logs');
  }
  logSheet.appendRow([" "]);
  logSheet.appendRow(["START: Download Students Information from FIRESTORE to " + sheetName,
  Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM-yyyy HH:mm")]);
  
  const token = getAuthToken(serviceAc.EMAIL, serviceAc.KEY);
  Logger.log ("Auth Token " + token);
  
  var baseUrl = parentURL + "appts";
  var totalRows = 0;
  const options = {
   'method' : 'get',
   'muteHttpExceptions' : true,
   'payload': "",
   'headers': {'content-type': 'application/json', 'Authorization': 'Bearer ' + token}
  };
  
  while (nextPageToken != "Last Page") {
    
    if (nextPageToken != "First Fetch")
      baseUrl = parentURL + "appts" + "?&pageToken=" + nextPageToken;
    
    Logger.log(baseUrl);
    response = UrlFetchApp.fetch(baseUrl, options);  
    if (response.getResponseCode() == 200) {
      Logger.log(response.getContentText());
      var resultSet = JSON.parse(response.getContentText());
    
      if (resultSet.hasOwnProperty("nextPageToken")) {
        Logger.log("Next Page Token: " + resultSet.nextPageToken);
        nextPageToken = resultSet.nextPageToken;
      } else {
        Logger.log("This is the last page");
        nextPageToken = "Last Page";
      }

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
        /*  "documents": [{
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
          if (fieldKeys[j] == "slot" && currField.length > 0) {
            currField = "_" + currField; // to prevent auto-convert to date format
          }
          currRow[colNo] = currField;
        }
        Logger.log("Curr Row :" + currRow);
        studentInfoSheet.appendRow(currRow);
      }
      totalRows = totalRows + resultSet.documents.length;
      if (nextPageToken === "Last Page")
        logSheet.appendRow(["END: Completed download Student Appointment Information. Total " +
                            totalRows + " rows", 
                            Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM-yyyy HH:mm")]);
    } else
      logSheet.appendRow(["END: Unable to download Student Appointment Information",
                          Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd-MMM-yyyy HH:mm")]);
  } // while (nextPageToken != "Last Page")
}