const SMTPServer = require("smtp-server").SMTPServer;

const server = new SMTPServer({
    allowInsecureAuth: true,
    authOptional: true,
    
    onConnect(session, callback) {
        console.log(`onConnect`, session.id);
        callback(); // Don't forget to call the callback to continue the connection
    },
    onMailFrom(address, session, callback) {
        console.log(`onMailFrom`, address.address, session.id);
        callback(); // Accept the sender address
    },
    onRcptTo(address, session, callback) {
        console.log(`onRcptTo`, address.address, session.id);
        callback(); // Accept the recipient address
    },
    onData(stream, session, callback) {
        console.log(`onData`, session.id);
        let emailData = '';
        stream.on('data', chunk => {
            emailData += chunk.toString();
        });
        stream.on('end', () => {
            console.log(`Email data received for session ${session.id}:`, emailData);
            callback(); // Don't forget to call the callback to continue the process
        });
    }
});
server.listen(25);
console.log("SMTP server listening on port 25");    