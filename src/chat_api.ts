import * as fs from "fs"

type User = {
    id: number,
    name: string
}

type Message = {
    role: string,
    content: string,
    chatId: number | null
}

type Chat = {
    id: number,
    user: number
    date: Date,
    messages: Message[]
}

import { Request, Response, Application } from 'express';
import express = require('express');
import { json } from "stream/consumers"

const app: Application = express();


app.use(express.json())

app.post("/chats", (req, res) => {
    /*
    req will be
    {
        "userId": 0,
        "message": {
            "role": "user",
            "content": "test message",
            "chatId": 0 | null //null if is the first message
        }
    }
    */
    var userId: number = parseInt(req.body.userId)
    var message: Message = req.body.message
    var chatId: number = 0
    var timestamp: number = new Date().getTime()
    var updateChat: boolean = false
    if (Number.isInteger(message.chatId)) {
        chatId = message.chatId
        updateChat = true
    } else {
        chatId = parseInt(`${timestamp}${userId}`)
    }
    //create new chat
    let chat: Chat = {id: chatId, user: userId, messages: [message], date: new Date(timestamp)}
    // to change with database
    // Step 1: Read existing JSON data from the file
    fs.readFile("db/chats.json", 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            res.status(500)
        }
    
        // Step 2: Parse JSON data into a JavaScript object
        let jsonData = [];
        try {
            jsonData = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            res.status(500)
        }
    
        // Step 3: Append the new object to the array or object
        if(updateChat) {
            let chatIndex = jsonData["chats"].findIndex((_chat: Chat) => _chat.id === chatId)
            if(chatIndex === -1) {
                res.status(404)
            } else {
                jsonData["chats"][chatIndex].messages.push(message)
                res.status(200)
            }
        } else {
            jsonData["chats"].push(chat);
        }
    
        // Step 4: Convert the updated object back to a JSON string
        const updatedJsonString = JSON.stringify(jsonData, null, 2);
    
        // Step 5: Write the updated JSON string back to the file
        fs.writeFile("db/chats.json", updatedJsonString, 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Error writing file:', writeErr);
                res.status(500)
            } else {
                console.log('Object appended to JSON file successfully!');

            }
        });
    });
    res.status(200)
    res.json({"chatId": chatId})
    res.end()
})

app.get("/users/:id", (req, res) => {
    const id = req.params.id
    console.log("users/:id called with params " + id)
    // Read the JSON file asynchronously
    fs.readFile("db/users.json", 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err.message}`);
            res.status(500)
        }

        try {
            // Parse the JSON data
            const jsonData = JSON.parse(data);

            const userIndex = jsonData['users'].findIndex((user: User) => user.id === parseInt(id))
            if (userIndex !== -1) {
                res.json(jsonData['users'][userIndex])
            } else {
                res.status(404).json({error: "User not found"});
            }
        } catch (jsonError) {
            console.error(`Error parsing JSON: ${jsonError.message}`);
            res.json(500)
        }
    });
})




app.listen(3000, () => {
    console.log("Server listening on port 3000")
})