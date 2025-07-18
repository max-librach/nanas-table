/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import { Resend } from "resend";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

const resend = new Resend("re_VtFWRMCG_PtYZB8vcCVEJgb5PweRfWtha"); // Replace with your real key

export const sendMemoryEmail = onDocumentCreated("memories/{memoryId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const memory = snapshot.data();
  const eventName = memory.occasion === "Holiday Meal" ? memory.holiday : memory.occasion;
  const creatorName = memory.createdByName ? memory.createdByName : "Unknown";
  const eventCode = memory.eventCode;
  // Format date as 'July 19th'
  const dateObj = memory.date ? new Date(memory.date) : null;
  const formatDate = (date: Date) => {
    const month = date.toLocaleString('en-US', { month: 'long' });
    const day = date.getDate();
    const daySuffix = (d: number) => {
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    return `${month} ${day}${daySuffix(day)}`;
  };
  const formattedDate = dateObj ? formatDate(dateObj) : '';
  // Format as 'Simchat Torah (July 19th) - Created by Max'
  const eventLabel = eventName && formattedDate ? `${eventName} (${formattedDate})` : eventName || formattedDate;
  const eventCreatorLine = `${eventLabel} - Created by ${creatorName}`;
  const url = eventCode ? `https://nanastable.me/memory/${eventCode}` : '';

  // Debug log for eventCode and URL
  console.log('sendMemoryEmail: eventCode:', eventCode, 'url:', url);

  const recipients = [
    "maxlibrach@gmail.com"
  ];

  const subject = `Share your memories from ${eventLabel}`;
  let body = `
Hey fam,

A new event was just added to Nana's Table:
${eventCreatorLine}

Now's a great time to add your own photos, stories, or anything you want to remember.

You can add your part here:
👉 Add your memory: ${url}
`;
  if (!memory.createdByName) {
    body += `\n(Note: The creator's name was not set. If this is you, please check your profile settings.)\n`;
  }
  if (url) {
    body += `\nIf you get a 404, try refreshing the page or double-checking the event code.\n`;
  }
  body += `\nIt only takes a minute, and I promise it'll be worth it when we (or the kids) look back on all of this later.\n\nLove,\nMax\n`;

  await resend.emails.send({
    from: "Nana's Table <hello@nanastable.me>", // Use a verified sender with display name
    to: recipients,
    subject,
    text: body,
  });
});

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
