const { google } = require('googleapis');
const { setIntervalAsync } = requre('set-interval-async/fixed');
const dotenv = require('dotenv');

dotenv.config();

// Generating a authentication URL
const oauth2Client = new google.auth.OAuth2(
  proccess.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);

// generate a url that asks permissions for readonly and modilfy scopes
const scopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
];

const url = oauth2Client.generateAuthUrl({
  // 'online' (default) or 'offline' (gets refresh_token)
  access_type: 'offline',

  // If you only need one scope you can pass it as a string
  scope: scopes
});



// This will provide an object with the access_token and refresh_token.
// Save these somewhere safe so they can be used at a later time.
const { tokens } = await oauth2Client.getToken(code)
oauth2Client.setCredentials(tokens);


//sending messages to the reciever
async function getMessages() {
  try {
    const auth = await oauth2Client();
    const gmail = google.gmail({ version: 'v1', auth:auth });

    const params = { userId: 'me', q: 'is:inbox' };

    const res = gmail.users.messages.list(params);
    for (const message of res.data.messages) {
      const messageData = await gmail.users.messages.get({ userId: 'me', id: message.id });

      const threadId = messageData.data.threadId;
      const payloadHeaders = messageData.data.payload.headers;

      let hasPreviousReply = false;
      for (const header of payloadHeaders) {
        if (header.name === "From" && header.value.includes("me")) {
          hasPreviousReply = true;
        }
      }
      // When user has not previously replied so we will reply to the new message
      if (!hasPreviousReply) {
        const messageParts = ["Hello,", "", "Thank you for your message. I am currently out of city. I won't be able come to office ", "", "Best,", "Satyam Kumar",];
        const messageBody = messageParts.join("\n");
        const sendOptions = {
          userId: "me",
          requestBody: {
            raw: Buffer.from(
              createMessage(
                "me",
                "noreply@gmail.com",
                "Out of city",
                messageBody,
                threadId
              )
            ).toString("base64"),
          },
        };
        await gamil.users.messages.send(sendOptions);
        const labelName = "AutoReply";
        const label = await gmail.users.labels.create({
          userId: "me",
          requestBody: {
            labelListVisibility: "labelShow",
            messageListVisibility: "show",
            name: labelName,
          },
        });
        await gmail.users.messages.modify({
          userId: "me",
          id: message.id,
          requestBody: {
            addLableIds: [label.data.id],
            removeLableIds: ["INBOX"],
          }
        });
        console.log(`Reply has been sent with thread Id ${threadId} and added lable "${labelName}"`);
      }
    }
  } catch (error) {
    console.log(error);
  }
}


setIntervalAsync(getMessages, Math.floor(Math.random() * 75000) + 45000);
