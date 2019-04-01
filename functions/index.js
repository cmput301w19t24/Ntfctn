'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Triggers when a user gets a new notification
 */
exports.sendNotification = functions.database.ref('/Notifications/{receiverId}/{ntfctnId}')
    .onWrite((change, context) => {
        const receiverId = context.params.receiverId;
        const ntfctnId = context.params.ntfctnId;

        // a notification is deleted, ignore this notification
        if (!change.after.val()) {
            console.log("A notification is deleted");
            return;
        }
        console.log('A new notification is sent to: ', receiverId , '; notificationID: ', ntfctnId);

        return admin.database()
            .ref(`/Users/${receiverId}/notificationToken`)
            .once('value')
            .then( tokenSnapshot => {
                const token = tokenSnapshot.val();
                console.log("token: ", token);

                const newNtfctn = change.after.val();

                const payload = {
                    notification: {
                        title: "New Notification",
                        body: "Your book status is updated by " + newNtfctn.senderName
                    }
                };

                console.log("payload");
                console.log(payload);
                return admin.messaging().sendToDevice(token, payload);

            })
            .then((response) => {
                response.results.forEach((result, index) => {
                    const error = result.error;
                    if (error) {
                        console.error('Failure sending notification:', error);
                    } else {
                        console.log("Notification sent successfully.");
                    }
            });
        });
    });