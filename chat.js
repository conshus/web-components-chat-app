const USER1 = '';
const USER1_JWT = '';
const USER2 = '';
const USER2_JWT = '';
const CONVERSATION_ID = '';

const leaveBtn = document.querySelector('#leave');

//Web Components
const vonageInputElement = document.querySelector('vonage-input');
const vonageTextAreaElement = document.querySelector('vonage-textarea');
const vonageMessagesElement = document.querySelector('vonage-messages');
const vonageTypingIndicatorElement = document.querySelector('vonage-typing-indicator');
const vonageUsersElement = document.querySelector('vonage-users');

function authenticate(username) {
    if (username == USER1) {
        return USER1_JWT;
    }
    if (username == USER2) {
        return USER2_JWT;
    }
    alert("User not recognized");
}

// Web Component
vonageInputElement.addEventListener('textEntered', (event) => {
    const userToken = authenticate(event.detail);
    if (userToken) {
        messages.style.display = 'flex';
        vonageInputElement.style.display = 'none';
        run(userToken);
    }
});

async function run(userToken){
    let client = new NexmoClient({ debug: false });
    let app = await client.login(userToken);
    let conversation = await app.getConversation(CONVERSATION_ID);
    // Update the UI to show which user we are
    document.getElementById('sessionName').innerHTML = conversation.me.user.name + "'s messages";

    let usersArray = [];

    conversation.members.forEach((value, key, map)=> {
        usersArray.push(value.user);
    });

    vonageUsersElement.users = usersArray;

    // Load events that happened before the page loaded
    let events = await conversation.getEvents({event_type: "text", page_size: 100});
    events.items.forEach(event => {
        console.log('event: ', event);
        vonageMessagesElement.addMessage(conversation.members.get(event.from), event, conversation.me);
    });


    // Any time there's a new text event, add it as a message
    conversation.on('text', async (sender, event) => {
        await vonageMessagesElement.addMessage(sender, event, conversation.me);
    });

    leaveBtn.addEventListener('click', async () => {
        await conversation.leave();
        messages.style.display = 'none';
        vonageInputElement.style.display = 'block';
    });

    //Web Component
    vonageTextAreaElement.addEventListener('messageEntered', async (event) => {
        await conversation.sendText(event.detail);
    });

    vonageTextAreaElement.addEventListener('startTyping', async (event) => {
        await conversation.startTyping();
    });

    vonageTextAreaElement.addEventListener('stopTyping', async (event) => {
        await conversation.stopTyping();
    });

    conversation.on("text:typing:on", (data) => {
        if (data.user.id !== data.conversation.me.user.id) {
            vonageTypingIndicatorElement.message = data.user.name + " is typing...";
        }
    });

    conversation.on("text:typing:off", (data) => {
        vonageTypingIndicatorElement.message = "";
    });

    conversation.on("member:joined", (member , event) => {
        let usersArray = [];
        conversation.members.forEach((value, key, map)=> {
            usersArray.push(value.user);
        });
        vonageUsersElement.users = usersArray;
    });

    conversation.on("member:left", (member , event) => {
        let usersArray = [];
        conversation.members.forEach((value, key, map)=> {
            usersArray.push(value.user);
        });
        vonageUsersElement.users = usersArray;
    });


}