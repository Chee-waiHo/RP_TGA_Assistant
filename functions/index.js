const functions = require('firebase-functions');
const admin = require('firebase-admin');
const config = require('./config');

var Promise = require('promise');

admin.initializeApp(functions.config().firebase);
let firestore = admin.firestore();
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

function chkEligibility (uin, callback) {
    firestore.collection('appts').doc(uin).get()
    .then(doc => {
        let eligibility = {status: 0, data: {}};
        if (doc.exists && doc.data().slot.length !== 0) {
            console.log("Appointment slot has already assigned: ", doc.data());
            eligibility.status = 9; 
            eligibility.data = doc.data();
        } else if (doc.exists && doc.data().slot.length === 0) {
            console.log("Eligible to make appointment: ", doc.data());
            eligibility.status = 1; 
            eligibility.data = doc.data();
        } else {
            console.log("Not eligible for appointment ", uin);
            eligibility.status = 0; 
            eligibility.data = doc.data();
        }
        callback(eligibility);
        return "Elgibility checks completed";
    })
    .catch(error => {
        console.error("Error getting document:", error);
    });
}
function setAppointment (request, response) {
    let params = request.body.queryResult.parameters;
    let searchUin = params.shortUin.charAt(0) + 'XXX' +
    params.shortUin.substr(1,5);
    
    chkEligibility (searchUin, eligibility => {
        console.log("Eligibility switch " + eligibility.status);
        let fulfillmentText = {};
        if (request.body.queryResult.action === "changeSlot" && 
            eligibility.status === 1) {
            // change to 9 because cannot request change if you no prior appt
            eligibility.status = 9;
        } else if (request.body.queryResult.action === "changeSlot" && 
            eligibility.status === 9) {
            // change to 1 because CAN change since there is prior appt
            eligibility.status = 1;
        }
        switch (eligibility.status) {
            case 1: {
                // Check if this is an actual slot
                let validTimeSlot =
                firestore.collection('timeslot').doc(params.slotChoice).get()
                .then(querySnapshot => {
                    if (!querySnapshot.exists) {
                        console.log(params.slotChoice, ' ', params.shortUin,
                        ' slot choice does not exits!');
                        fulfillmentText = {fulfillmentText: `${params.fullName}, ` +
                        `${params.slotChoice} is unavailable. If you wish to ` +
                        `book another appointment, type START AGAIN.`};
                        response.send(fulfillmentText);
                        return Promise.all(true);;
                    }
                })
                .catch(err => {
                    console.log('Error checking selected time slot exists', err);
                    return ("Error checking selected time slot exists");
                });
                console.log("Waiting for promise ", validTimeSlot);
                validTimeSlot.then (notValid => {
                    if (notValid) {
                        return;
                    }
                    firestore.collection('appts').doc(searchUin).set({
                        slot: params.slotChoice
                    }, { merge: true })
                    .then(()=> {
                        fulfillmentText = {fulfillmentText: `${params.fullName}, ` +
                        `your appointment on ${params.slotChoice} is confirmed`};
                        console.log("Appointment successfully logged! ",
                        params.shortUin);
                        response.send(fulfillmentText);
                        return("Appointment successfully logged! " + 
                        params.shortUin);
                    })
                    .catch(error => {   
                        fulfillmentText = {fulfillmentText: `${params.fullName}, we
                        were unable to log an appointment on` +
                        `{$params.slotChoice}. Please contact Ms Francis Yip at ` +
                        `61234567 for assistance`};
                        console.error("Error logging appointment: ", error);
                        response.send(fulfillmentText);
                        return("Error logging appointment: ", error);
                    });
                })
                .catch(err => {
                    console.log('Error verifying time slot exists', err);
                    return ("Error verifying time slot exists");
                });
          
                break;
            }
            case 0: {
                fulfillmentText = {fulfillmentText: `${params.fullName}, ` +
                `I am not informed that a student with trailing student id ` +
                `${params.shortUin} ` + `has TGA signing that is due. If you wish to ` +
                `re-submit your particulars, type START AGAIN.`};
                response.send(fulfillmentText);
                break;
            }
            case 9: {
                if (request.body.queryResult.action === "changeSlot") {
                    let payload = {'telegram': {
                        'text': `${params.fullName}, ` +
                            ` It looks that you have yet to make any ` +
                            `appointment to sign the TGA. `,
                        'reply_markup' : {}
                        }
                    };
                    payload.telegram.reply_markup.inline_keyboard = [
                        [{'text':'Book Now', 'callback_data':'Book Now'},
                        {'text':'Come Back Later', 'callback_data':'Come Back Later'}]
                    ];
                    console.log ('Custom Payload ' + `${JSON.stringify(payload)}`);           
                    fulfillmentText = {fulfillmentText: `${params.fullName}, ` +
                    `you have an existing appointment on ${eligibility.data.slot}`, payload};
                    response.send(fulfillmentText);
                } else { // attempt to book an appointment but has existing appointment
                    let payload = {'telegram': {
                            'text': `${params.fullName}, ` +
                                `you have an existing appointment on ${eligibility.data.slot}`,
                            'reply_markup' : {}
                        }
                    };
                    payload.telegram.reply_markup.inline_keyboard = [
                        [{'text':'Change Now', 'callback_data':'Change Now'},
                        {'text':'Keep Appointment', 'callback_data':'Keep Appointment'}]
                    ];
                    console.log ('Custom Payload ' + `${JSON.stringify(payload)}`);           
                    fulfillmentText = {fulfillmentText: `${params.fullName}, ` +
                    `you have an existing appointment on ${eligibility.data.slot}`, payload};
                    response.send(fulfillmentText);
                }
                break;
            }
        }   
         return "Completed ALL appointment setting ";
    });
}

// Return available days, making 1st appointment
function getAvailAppointmentDays(request, response) {
    let params = request.body.queryResult.parameters;
    let searchUin = params.shortUin.charAt(0) + 'XXX' +
    params.shortUin.substr(1,5);
    
    chkEligibility (searchUin, eligibility => {
        console.log("Eligibility switch " + eligibility.status);
        let fulfillmentText = {};
        if (request.body.queryResult.action === "requestChangeApptDay" && 
            eligibility.status === 1) {
            // change to 9 because cannot request change if you no prior appt
            eligibility.status = 9;
        } else if (request.body.queryResult.action === "requestChangeApptDay" && 
            eligibility.status === 9) {
            // change to 1 because CAN change since there is prior appt
            eligibility.status = 1;
        }
        switch (eligibility.status) {
            case 1: {
                // For technical reasons not fully understood, not able
                // to encapsulate retrieval of all timeslots as a function
                // Retrieve all time slots: Start
                let allTimeSlotsArray = [];
                let allTimeSlots = firestore.collection('timeslot').orderBy("from").get()
                .then(querySnapshot => {
                    querySnapshot.forEach(doc => {
                        console.log(doc.id, '==>', doc.data());
                        let docRef = firestore.collection('timeslot').doc(doc.id);
                        allTimeSlotsArray.push(docRef.get());
                    });
                    console.log ("Complete retrieval of all time slots <no chks> ",
                    allTimeSlotsArray.length);
                    return Promise.all(allTimeSlotsArray);
                })
                .catch(err => {
                    console.log('Error retrieving all time slots', err);
                    return ("Error retrieving all time slots");
                }); // Retrieve all times slots: End
                
                allTimeSlots
                .then(results => {
                    checkDaysAvail_SendResponse(results, params, request, response, eligibility);
                    console.log("Completed async availability checks for each ",
                    "timeslot, results pending");
                    return ("Completed async availability checks for each timeslot");
                })
                .catch(err => {
                    console.log('Error checking availability for each timeslot',
                    err);
                    return ("Error checking availability for each timeslot");
                });
                break;
            }
            case 0: {
                fulfillmentText = {fulfillmentText: `${params.fullName}, ` +
                `I am not informed that a student with trailing student id ` +
                `${params.shortUin} ` + `has TGA signing that is due. If you wish to ` +
                `re-submit your particulars, type START AGAIN.`};
                response.send(fulfillmentText);
                break;
            }
            case 9: {
                if (request.body.queryResult.action === "requestChangeApptDay") {
                    let payload = {'telegram': {
                        'text': `${params.fullName}, ` +
                            ` It looks that you have yet to make any ` +
                            `appointment to sign the TGA. `,
                        'reply_markup' : {}
                        }
                    };
                    payload.telegram.reply_markup.inline_keyboard = [
                        [{'text':'Book Now', 'callback_data':'Book Now'},
                        {'text':'Come Back Later', 'callback_data':'Come Back Later'}]
                    ];
                    console.log ('Custom Payload ' + `${JSON.stringify(payload)}`);           
                    fulfillmentText = {fulfillmentText: `${params.fullName}, ` +
                    `It looks that you have yet to make any appointment to ` + 
                    `sign the TGA. `, payload};
                    response.send(fulfillmentText);
                } else { // want to book an appt but prior appt already exists
                    let payload = {'telegram': {
                            'text': `${params.fullName}, ` +
                                `you have an existing appointment on ${eligibility.data.slot}`,
                            'reply_markup' : {}
                        }
                    };
                    payload.telegram.reply_markup.inline_keyboard = [
                        [{'text':'Change Now', 'callback_data':'Change Now'},
                        {'text':'Keep Appointment', 'callback_data':'Keep Appointment'}]
                    ];
                    console.log ('Custom Payload ' + `${JSON.stringify(payload)}`);           
                    fulfillmentText = {fulfillmentText: `${params.fullName}, ` +
                    `you have an existing appointment on ${eligibility.data.slot}`, payload};
                    response.send(fulfillmentText);
                }
                break;
            }
        }
        return "Completed ALL appointment sessions retrieval ";
     });
}

function comparator(a, b) {
    if (a[0] < b[0])
        return -1;
    if (a[0] > b[0])
       return 1;
    return 0;
}

function chgMMMtoMM(chgFromMMM) {
    MMMtoMM = [];
    MMMtoMM['Jan'] = '01'; MMMtoMM['Feb'] = '02'; MMMtoMM['Mar'] = '03';
    MMMtoMM['Apr'] = '04'; MMMtoMM['May'] = '05'; MMMtoMM['Jun'] = '06';
    MMMtoMM['Jul'] = '07'; MMMtoMM['Aug'] = '08'; MMMtoMM['Sep'] = '09';
    MMMtoMM['Oct'] = '10'; MMMtoMM['Feb'] = '11'; MMMtoMM['Mar'] = '12';
    return MMMtoMM[chgFromMMM];
}

function checkDaysAvail_SendResponse(results, params, request, response, eligibility) {
    let allocated = 0, arrayApptDayAMPM = [], tempApptDayAMPM = "", i=0, seq="";
    results.forEach(doc => {
        console.log("Checking timeslot ", doc.id, "**>", doc.data());
        firestore.collection('appts').where("slot", "==", doc.id).get()
        .then(querySnapshot => {
            allocated = querySnapshot.size;
            console.log (`${doc.id} has ${allocated} students allocated out of` +
            ` possible ${doc.data().max}`);
            i++;
            if (allocated < doc.data().max ) {
                 // Check if the day (AM/PM) is already present
                tempApptDayAMPM = doc.id.substr(0, 9) + " " + doc.id.substr(16, 2);
                if (arrayApptDayAMPM.indexOf(tempApptDayAMPM) === -1) {
                    arrayApptDayAMPM.push(tempApptDayAMPM);
                }
            }
            if (i === results.length) { // send response when completed all checks
                advisorMsg = "";
                if (arrayApptDayAMPM.length > 0) {
                    if (request.body.queryResult.action === "requestChangeApptDay")  {
                        advisorMsg = `${params.fullName}, ` +
                        `you have an existing appointment on ${eligibility.data.slot}. ` +
                        `If you wish, you can proceed to change it to one ` +
                        `of the following sessions.`
                    } else {
                        advisorMsg =`${params.fullName}, ` +
                        `It looks that you have yet to make any ` +
                        `appointment to sign the TGA. Here are some ` +
                        `available sessions. Please select one.`;
                    }
                    let payload = {'telegram': {
                            'text': advisorMsg,
                            'reply_markup' : {}
                        }
                    };
                    // sort the array in accordance to orginal sequence to get date seq correct
                    for (j = 0; j < arrayApptDayAMPM.length; j++) {
                        // need to convert to YY-MM-DD HH:MM AM/PM for sort
                        seq = arrayApptDayAMPM[j];
                        seq = seq.substr(7, 2) + chgMMMtoMM(seq.substr(3, 3)) +
                        seq.substr(0, 2) + seq.substr(10, 2); 
                        arrayApptDayAMPM[j]=[seq, arrayApptDayAMPM[j]];
                    }
                    arrayApptDayAMPM = arrayApptDayAMPM.sort(comparator);
                    let tempInline_Keyboard = [], k = -1, l = 0;
                    for (j = 0; j < arrayApptDayAMPM.length; j++) {
                        if (j % 2 === 0) {
                            k++;
                            l = 0;
                            tempInline_Keyboard[k] = [];
                        } else {
                            l = 1;
                        }
                        tempInline_Keyboard[k][l] = {'text': `${arrayApptDayAMPM[j][1]}`, 
                        'callback_data': `${arrayApptDayAMPM[j][1]}`};
                    }
                    if (j % 2 === 1) // if odd number of buttons, gv more balanced look
                        tempInline_Keyboard[k][1] = {'text': '-', 'callback_data': '-'};  

                    payload.telegram.reply_markup.inline_keyboard = tempInline_Keyboard;
                    console.log ('Custom Payload ' + `${JSON.stringify(payload)}`);
                    response.send({fulfillmentText: `${params.fullName}, ` +
                    `please select one of the following days ` + `${arrayApptDayAMPM.toString()}`,
                    payload});
                } else {
                    response.send({fulfillmentText: `${params.fullName}, ` +
                    `there is no more time slots available, please call ` +
                    `one-stop centre at 6697-1234 for assistance`});
                }
            }
            return ("Completed availability check for " + doc.id);
        })
        .catch(err => {
            console.log('Error retrieving all time slots', err);
            return ("Error retrieving all time slots");
        });
        console.log("Checking the next slot");
    });
    console.log("Completed checking availability");
    return("Completed checking availability");
}

function getAvailAMPMSlots(request, response){
    let params = request.body.queryResult.parameters;
    let searchUin = params.shortUin.charAt(0) + 'XXX' +
    params.shortUin.substr(1,5);
    let sessionChoice = params.sessionChoice;

    chkEligibility (searchUin, eligibility => {
        console.log("Eligibility switch " + eligibility.status);
        let fulfillmentText = {};
        if (request.body.queryResult.action === "changeRequestReturnSlots" && 
            eligibility.status === 1) {
            // change to 9 because cannot request change if you no prior appt
            eligibility.status = 9;
        } else if (request.body.queryResult.action === "changeRequestReturnSlots" && 
            eligibility.status === 9) {
            // change to 1 because CAN change since there is prior appt
            eligibility.status = 1;
        }
        switch (eligibility.status) {
            case 1: {
                // Canot encapsulates retrieval of all timeslots as a function
                // due to async nature of firebase document retrieval
                // Retrieve all time slots for a session: Start
                let sessionTimeSlotsArray = [], thisSession = "";
                let sessionTimeSlots = firestore.collection('timeslot').get()
                .then(querySnapshot => {
                    querySnapshot.forEach(doc => {
                        console.log(doc.id, 'raw ==>', doc.data());
                        thisSession = doc.id;
                        thisSession = thisSession.substr(0,9) + " " +
                        thisSession.substr(16,2);
                        if (thisSession === sessionChoice) {
                            console.log(doc.id, 'belongs to session ==>',
                            doc.data());
                            let docRef = firestore.collection('timeslot').doc(doc.id);
                            sessionTimeSlotsArray.push(docRef.get());
                        }
                    });
                    console.log ("Complete retrieval of all session time slots ",
                    sessionTimeSlotsArray.length);
                    if (sessionTimeSlotsArray.length === 0) {
                        fulfillmentText = {fulfillmentText: `${params.fullName}, ` +
                        `you seem to have selected an invalid day. ` +
                        `you may type START AGAIN to book another appointment.`};
                        response.send(fulfillmentText);
                    }
                    return Promise.all(sessionTimeSlotsArray);
                })
                .catch(err => {
                    console.log('Error retrieving time slots for session', err);
                    return ("Error retrieving all time slots for session");
                }); // Retrieve all time slots for a session: End
                
                sessionTimeSlots
                .then(results => {
                    checkSessionSlotsAvail_SendResponse(results, params, response);
                    console.log("Completed async availability checks for each ", 
                    "timeslot of SELECTED SESSION, results pending");
                    return ("Completed async availability checks for SELECTED ",
                    "SESSION timeslots");
                })
                .catch(err => {
                    console.log('Error checking availability for each timeslot',
                    err);
                    return ("Error checking availability for each timeslot");
                });
                break;
            }
            case 0: {
                fulfillmentText = {fulfillmentText: `${params.fullName}, ` +
                `I am not informed that a student with trailing student id ` +
                `${params.shortUin} ` + `has TGA signing that is due. If you wish to ` +
                `re-submit your particulars, type START AGAIN.`};
                response.send(fulfillmentText);
                break;
            }
            case 9: {
                if (request.body.queryResult.action === "changeRequestReturnSlots") {
                    let payload = {'telegram': {
                        'text': `${params.fullName}, ` +
                            ` It looks that you have yet to make any ` +
                            `appointment to sign the TGA. `,
                        'reply_markup' : {}
                        }
                    };
                    payload.telegram.reply_markup.inline_keyboard = [
                        [{'text':'Book Now', 'callback_data':'Book Now'},
                        {'text':'Come Back Later', 'callback_data':'Come Back Later'}]
                    ];
                    console.log ('Custom Payload ' + `${JSON.stringify(payload)}`);           
                    fulfillmentText = {fulfillmentText: `${params.fullName}, ` +
                    `It looks that you have yet to make any appointment to ` + 
                    `sign the TGA. `, payload};
                    response.send(fulfillmentText);
                } else {
                    fulfillmentText = {fulfillmentText: `${params.fullName}, ` +
                    `you have an existing appointment on ${eligibility.data.slot}`};
                    response.send(fulfillmentText);
                }
                break;
            }
        }
        return "Completed SELECTED appointment sessions retrieval ";
     });
    
}

function checkSessionSlotsAvail_SendResponse(results, params, response) {
    let allocated = 0, arrayTimeSlot= [], tempTimeSlot = "", i=0 ;
    results.forEach(doc => {
        console.log("Checking timeslot ", doc.id, "**>", doc.data());
        firestore.collection('appts').where("slot", "==", doc.id).get()
        .then(querySnapshot => {
            allocated = querySnapshot.size;
            console.log (`${doc.id} has ${allocated} students allocated out of` +
            ` possible ${doc.data().max}`);
            i++;
            if (allocated < doc.data().max ) {
                if (arrayTimeSlot.indexOf(tempTimeSlot) === -1) {
                    arrayTimeSlot.push(doc.id);
                }
            }
            if (i === results.length) { // send response when completed all checks
                if (arrayTimeSlot.length > 0) {
                    let payload = {'telegram': {
                            'text': `${params.fullName}, ` +
                                `That's great. Please select one of the ` +
                                `following time slots.`,
                            'reply_markup' : {}
                        }
                    };
                    // sort the array in accordance to orginal sequence to get date seq correct
                    let seq = "";
                    for (j = 0; j < arrayTimeSlot.length; j++) {
                        // need to convert to shift AM/PM fwd for sort
                        seq = arrayTimeSlot[j];
                        seq = seq.substr(0, 9) + seq.substr(16, 2) + seq.substr(10, 5);  
                        arrayTimeSlot[j]=[seq, arrayTimeSlot[j]];
                    }
                    arrayTimeSlot = arrayTimeSlot.sort(comparator);
                    let tempInline_Keyboard = [], k = -1, l = 0;
                    for (j = 0; j < arrayTimeSlot.length; j++) {
                        if (j % 2 === 0) {
                            k++;
                            l = 0;
                            tempInline_Keyboard[k] = [];
                        } else {
                            l = 1;
                        }
                        tempInline_Keyboard[k][l] = {'text': `${arrayTimeSlot[j][1]}`, 
                        'callback_data': `${arrayTimeSlot[j][1]}`};
                    }
                    if (j % 2 === 1) // if odd number of buttons, gv more balanced look
                        tempInline_Keyboard[k][1] = {'text': '-', 'callback_data': '-'}; 

                    payload.telegram.reply_markup.inline_keyboard = tempInline_Keyboard;
                    console.log ('Custom Payload ' + `${JSON.stringify(payload)}`);
                    response.send({fulfillmentText: `${params.fullName}, ` +
                    `please select one of the following time slots ` + 
                    `${arrayTimeSlot.toString()}`, payload});
                } else {
                    response.send({fulfillmentText: `${params.fullName}, ` +
                    `there is no time slot available for ` +
                    `${params.sessionChoice} session, please select another day.`});
                }
            } 
            return ("Completed availability check for " + doc.id);
        })
        .catch(err => {
            console.log('Error retrieving SELECTED SESSION  time slots', err);
            return ("Error retrieving SELECTED SESSION time slots");
        });
        console.log("Checking the next slot");
    });
    console.log("Completed checking availability");
    return("Completed checking availability");
}

exports.rpApptAsstWebhook = functions.https.onRequest((request, response) => {
        
    console.log("Request Header ", request.headers);
    console.log("Request Body ", request.body);
    
    let authentication = request.headers.authorization.replace(/^Basic/, '');
    authentication = (new Buffer(authentication, 'base64')).toString('utf8');
    loginInfo = authentication.split(':');
 
    console.log("user name / pass ", loginInfo[0], loginInfo[1]);
    if (loginInfo[0] !== config.authenticate.USERNAME || loginInfo[1] !== 
        config.authenticate.PASSWORD) {
        response.send('Invalid user name and password...');
        return ("Invalid user name and password...");
    }
    
    switch (request.body.queryResult.action) {
        case "checkCurrentStatus": {
            console.log("Check Current Status");
            getAvailAppointmentDays(request, response);
            console.log("Completed Check Current Status");
            break;
        }
        case "requestChangeApptDay": {
             console.log ("Change Request: Check Available Appt Days");
             getAvailAppointmentDays(request, response);
             console.log ("Change Request: Complete Check Available Appt Days");
             break;
         }
        case "returnSlots": {
            console.log("Display Time Slots for Selected Day");
            getAvailAMPMSlots(request, response);
            break;
        }
        case "changeRequestReturnSlots" : {
            console.log("Change Request: Display Time Slots for Selected Day");
            getAvailAMPMSlots(request, response);
            break;
        }
        case "bookSlot": {
            console.log("Set Appointment");
            setAppointment(request, response);
            console.log("Completed Set Appointment ");
            break;
        }
        case "changeSlot": {
            console.log("Change Request: Reset Appointment");
            setAppointment(request, response);
            console.log("Change Request: Reset Set Appointment ");
            break;
        }
        default:{
            console.log("No action taken");
            break;
        }
    }
    return("Completed webhook processing");
});
