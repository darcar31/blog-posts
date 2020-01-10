# Building a Slack App with Express and the Node-SDK

I recently tried to build a Slack App to learn about the process and technology and I very quickly found myself a bit overwhelmed. The Slack API is full-featured and heavily documented, which means it can be easy to get lost wandering through the massive amounts of information. This article pools together many different docs and blogs to hopefully build a single coherent resource.

In this post, I walk through how to develop a custom Slack Bot Application with the Slack Node SDK and Express. We will:
- Register and configure a Slack Application from the [Slack Developer site](https://api.slack.com/).
- Create an [Express Server](https://expressjs.com/) and register it with your Slack App.
- Use the [Node SDK Events API](https://slack.dev/node-slack-sdk/events-api) to listen to app mentions.
- Use the [Node SDK Web Client](https://slack.dev/node-slack-sdk/web-api) to send messages to a channel from our bot.
- Use the [Slack Block Kit](https://api.slack.com/block-kit) and [Block Kit Builder](https://api.slack.com/tools/block-kit-builder) to create interactive messages.
- Use [Node SDK Interactive Messages API](https://slack.dev/node-slack-sdk/interactive-messages) to listen to the interactive actions.
- User Slack Block Kit and Block Kit Builder to create a [modal](https://api.slack.com/surfaces/modals) with an interactive form with validation rules.

This tutorial builds a demo application that goes through the following flow:
 1. The App Bot listens for any mentions of itself.
 2. Once mentioned, the bot will respond to the mention with a prompt.
 3. If accepted, the prompt will open a modal with a form. The form will contain a dropdown and a text input. On submit, the form will be validated.
 4. The submitted valid form data will log to the console! YAY!
 
***Note: The Slack API is going through revisions and is often changing, so do notice of the date of this writing.**
 
## Setup and Configuration
Slack Apps are highly configurable and customizable, so they take a bit of initial bootstrapping to get going. 
  
### Creating a Slack Application & Bot

The first thing you need to do is to register your app with Slack at the [Slack Developer Site](https://api.slack.com/). Once you've created your Slack developer login, you will be able to `Create New App` in the `Your Apps` section.

You will be prompted to enter a Slack Workspace that you have access to as a development space. This workspace will be your dev environment; your bot will be deployed here for testing and experimenting.

// todo prompt of slack workspace

Next, we need to create a bot for our App. 

- Go to `Bot Users`
- Click `Add Bot User`
- Create a display name and user name for you Slack bot
- Click `Add Bot User`.
  
  
### Introducing the Node SDK
Slack has a [multitude of SDKs](https://api.slack.com/tools) available for developers, and I personally found it tricky to figure out which did what and why I might use them. 

One of the developer tools includes [Bolt](https://slack.dev/bolt/concepts), a lightweight framework that allows you to quickly build Slack apps with limited functionality. Bolt is also developed in JavasScript, so it can be easy to get the documentation confused with building a custom Node server. But, in this tutorial, we will focus solely on the [Slack Node SDK.] (https://github.com/slackapi/node-slack-sdk). The Slack Node SDK is a collection of packages that give you the ability to interact with just about everything in the Slack platform, without having to explicity build out RESTful capabilities. 

Note: Each tool has its own set of documentation that tends to look similar to each other, so it is important to be aware of what specific docs you are looking at.

### Getting Your Node Server Installed in a Slack Workspace

In order to install a Node Server as a bot in a Workspace, your app must be enabled for at least one [permissions scope](https://api.slack.com/docs/oauth-scopes). To set these scopes, go to `OAuth & Permissions`, then scroll down to `Scopes`.

Our demo application will need three scopes: `bot` `chat:write:bot` and `users:read`

// todo insert photo here of scopes 

With these permissions, you can scroll back up to `OAuth Tokens & Redirect URLs` and click `Install App to Workspace`. Once accepted, your bot is installed, and you will have an `OAuth Access Token` and a `Bot User OAuth Access Token`. We will use these tokens later on.
 
### Starting our Node Server

Once you have registered a Slack App, let's begin building out our Node server. As we add functionality to our server, we will adjust the configuration for our app.

To start, initialize a new npm repository and create an `app.js file`. In this file, we are going to spin up a lightweight [Express server](https://expressjs.com/).

```
const express = require('express');
const bodyParser = require('body-parser');

const port = process.env.PORT || 3000;
const app = express();

// Starts server
app.listen(port, function() {
  console.log('Bot is listening on port ' + port);
})

```

## Listening to App Mentions
The first piece of functionality we are going to build is the bot's ability to listen for mentions.

### Introducing the Node SDK Events API
For this: we need to set up our server to receive events with the [Slack Events API](https://api.slack.com/events-api). To use the [Node SDK Slack Events API](https://slack.dev/node-slack-sdk/events-api),  install `@slack/events-api`:

`npm add @slack/events-api`

### Creating a URL for our Node Server to Accept Events
For our Slack development workspace to talk to our Node server, we have to provide a URL where it can be accessed. There are many ways to do this; the easiest I found was to use [ngrok](https://ngrok.com/).

The Slack blog has a great post about using [ngrok for local development](https://api.slack.com/tutorials/tunneling-with-ngrok)

Once ngrok is installed and on your `$PATH`, we are going to tunnel our development port. In this case, I have chosen port 3000.

`ngrok http 3000`

<details>
<summary>Once running, you should see an output like this:</summary>
<p>

```
daria$ ngrok http 3000
ngrok by @inconshreveable                                                                              (Ctrl+C to quit)

Session Status                online
Session Expired               Restart ngrok or upgrade: ngrok.com/upgrade
Version                       2.3.35
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    http://13605143.ngrok.io -> http://localhost:3000
Forwarding                    https://13605143.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              105     0       0.00    0.00    5.01    5.34
```
</p>
</details>


In this status message, `http://13605143.ngrok.io` is now being forwarded to `http://localhost:3000`.

Note: the forwarded URL is dynamic and changes every time you run the ngrok command. 

Next, we need to create a path to be the location that accepts the events on our Express server. Many of the Slack docs recommend using `/slack/events`. So in this example, my full URL would be
http://13605143.ngrok.io/slack/events.

### Getting Ready to Respond to the Slack Challenge

To make sure the URL you provide for your server belongs to you, when registering your URL with Slack, Slack sends a challenge request. To accept the challenge, your server must respond with a specific reply. 

Luckily, instead of building this functionality into our server, we can use a command-line utility built into the `@slack/events-api` package. To use it, we need our signing secret, which is available in the `Basic Information` section of the developer configuration. We also need the name of our events path.

`$ ./node_modules/.bin/slack-verify --secret <signing_secret> [--path=/slack/events] [--port=3000]\` 

This command starts a server that correctly accepts the Slack Events API challenge. Now we can head over to the `Event Subscriptions` section of the configuration.

Turn on `Enable Events`.

Here we are going to enter the URL we got from running the `ngrok` command above. In my case, `http://13605143.ngrok.io/slack/events`. When this URL is entered, Slack sends the challenge message, which should be correctly accepted by our running utility server.

Once this URL is verified, we can stop the `./node_modules/.bin/slack-verify` server.  

### Woah! We Can Finally Write Some Code

With all this configuration out of the way, We can consume the Slack Events API to listen to app mentions for our bot in our app.js file.

To listen to Slack events, we need to use the Node SDK `Events Adapter` provided by the Events API and install it as an Express middleware.
The Events Adapter requires the `Signing Secret` that can be found in `Basic Information` and passed to Node via an environment variable.

The path given to `app.use` needs to correspond to the path given to ngrok and registered to the Slack App configuration.

```
const { createEventAdapter } = require('@slack/events-api')
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET)

app.use('/slack/events', slackEvents.expressMiddleware())

```

Note: Make sure to install this middleware above the body-parser middleware.

With slackEvents installed, we are free to use it to listen to bot mentions with the [app mention event](https://api.slack.com/events/app_mention).

```
slackEvents.on('app_mention', async (event) => {
  try {
    console.log("I got a mention in this channel", event.channel)
  } catch (e) {
    console.log(e)
  }
})
```

Now, when you go to a channel in your development workspace and @ mention your bot, you should see some console messages! WOOO WE DID SOMETHING!

## Responding to the App Mention

Next, let's add some logic to have our bot respond to the mention. 

### Introducing the Node SDK Web Client

To emit event messages back to Slack, we need to use the [Slack Node SDK Web API](https://github.com/slackapi/node-slack-sdk#posting-a-message-with-web-api) located in `@slack/web-api`. 

To initialize a Web Client, you will need the `Bot User OAuth Access Token` from the `OAuth & Permissions` section of the developer config.
To keep this token secret, I also pass it in through an environment variable.

```
const { WebClient } = require('@slack/web-api')

const token = process.env.SLACK_BOT_TOKEN
const webClient = new WebClient(token)
```

This webClient instance has a chat object, which allows you to [post a message block event](https://api.slack.com/methods/chat.postMessage) back to slack.

`web.chat.postMessage(messageBlock)`

The docs for the generic (non-Node specific) Web API are [here](https://api.slack.com/methods) and contain a list of available methods.

### Introducing Block Kit and the Slack Interactions API for Node SDK

What exactly is this message block I am posting? Well... Slack provides a component framework called [Block Kit](https://api.slack.com/block-kit). Block Kit allows you to put together JSON "blocks" that represent visual and interactive components. Each block is made up of [Block Elements](https://api.slack.com/reference/block-kit/block-elements). A full list of blocks can be found [here](https://api.slack.com/reference/block-kit/blocks).

Slack also provides a handy tool called the [Block Kit Builder](https://api.slack.com/tools/block-kit-builder?mode=message&blocks=%5B%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22Hello%2C%20Assistant%20to%20the%20Regional%20Manager%20Dwight!%20*Michael%20Scott*%20wants%20to%20know%20where%20you%27d%20like%20to%20take%20the%20Paper%20Company%20investors%20to%20dinner%20tonight.%5Cn%5Cn%20*Please%20select%20a%20restaurant%3A*%22%7D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Farmhouse%20Thai%20Cuisine*%5Cn%3Astar%3A%3Astar%3A%3Astar%3A%3Astar%3A%201528%20reviews%5Cn%20They%20do%20have%20some%20vegan%20options%2C%20like%20the%20roti%20and%20curry%2C%20plus%20they%20have%20a%20ton%20of%20salad%20stuff%20and%20noodles%20can%20be%20ordered%20without%20meat!!%20They%20have%20something%20for%20everyone%20here%22%7D%2C%22accessory%22%3A%7B%22type%22%3A%22image%22%2C%22image_url%22%3A%22https%3A%2F%2Fs3-media3.fl.yelpcdn.com%2Fbphoto%2Fc7ed05m9lC2EmA3Aruue7A%2Fo.jpg%22%2C%22alt_text%22%3A%22alt%20text%20for%20image%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Kin%20Khao*%5Cn%3Astar%3A%3Astar%3A%3Astar%3A%3Astar%3A%201638%20reviews%5Cn%20The%20sticky%20rice%20also%20goes%20wonderfully%20with%20the%20caramelized%20pork%20belly%2C%20which%20is%20absolutely%20melt-in-your-mouth%20and%20so%20soft.%22%7D%2C%22accessory%22%3A%7B%22type%22%3A%22image%22%2C%22image_url%22%3A%22https%3A%2F%2Fs3-media2.fl.yelpcdn.com%2Fbphoto%2Fkorel-1YjNtFtJlMTaC26A%2Fo.jpg%22%2C%22alt_text%22%3A%22alt%20text%20for%20image%22%7D%7D%2C%7B%22type%22%3A%22section%22%2C%22text%22%3A%7B%22type%22%3A%22mrkdwn%22%2C%22text%22%3A%22*Ler%20Ros*%5Cn%3Astar%3A%3Astar%3A%3Astar%3A%3Astar%3A%202082%20reviews%5Cn%20I%20would%20really%20recommend%20the%20%20Yum%20Koh%20Moo%20Yang%20-%20Spicy%20lime%20dressing%20and%20roasted%20quick%20marinated%20pork%20shoulder%2C%20basil%20leaves%2C%20chili%20%26%20rice%20powder.%22%7D%2C%22accessory%22%3A%7B%22type%22%3A%22image%22%2C%22image_url%22%3A%22https%3A%2F%2Fs3-media2.fl.yelpcdn.com%2Fbphoto%2FDawwNigKJ2ckPeDeDM7jAg%2Fo.jpg%22%2C%22alt_text%22%3A%22alt%20text%20for%20image%22%7D%7D%2C%7B%22type%22%3A%22divider%22%7D%2C%7B%22type%22%3A%22actions%22%2C%22elements%22%3A%5B%7B%22type%22%3A%22button%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Farmhouse%22%2C%22emoji%22%3Atrue%7D%2C%22value%22%3A%22click_me_123%22%7D%2C%7B%22type%22%3A%22button%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Kin%20Khao%22%2C%22emoji%22%3Atrue%7D%2C%22value%22%3A%22click_me_123%22%7D%2C%7B%22type%22%3A%22button%22%2C%22text%22%3A%7B%22type%22%3A%22plain_text%22%2C%22text%22%3A%22Ler%20Ros%22%2C%22emoji%22%3Atrue%7D%2C%22value%22%3A%22click_me_123%22%7D%5D%7D%5D) 
This builder provides a drag and drop UI that generates JSON blocks from a live example.

It is important to note that at the time of this writing, some block elements can only be used in particular contexts. For example, input blocks are only available inside of modals, but not messages. Be aware of which context you are building, and which blocks are available to you, or you will receive an API error.

For our bot message response, I want it to look like this:

// TODO bot message response image

A simple message that contains a button that launches a modal. 

<details>
<summary>Using the Block Kit Builder, I've translated this design into the following JSON:</summary>
<p>

```
{
   "blocks": [
      {
         "type": "section",
         "text": {
            "type": "mrkdwn",
            "text": "Hello, thanks for calling me. Would you like to launch a modal?"
         },
         "accessory": {
            "type": "button",
            "text": {
               "type": "plain_text",
               "text": "Launch",
               "emoji": true
            },
            "value": "launch_button_click"
            "action_id": "open_modal_button" // We need to add this  
         }
      }
   ]
}
```
</p>
</details>  

In order to identify our button on click, we need to make sure to add an `action_id` to its JSON block. This key is not provided from the Block Kit Builder; you have to add it.

Note: In general, any identifying or interaction specific JSON is not included in the Block Kit Builder output, and the developer is responsible for managing ids and callbacks.

### Sending Back a Message Block

Now that we have our message blocks. We can send them through the `postMessage` function. In order to correctly post a message, we need to include the channel to target. We can get that information from the [mention event](https://api.slack.com/events/app_mention). 

```

slackEvents.on('app_mention', async (event) => {
  try {
    const mentionResponseBlock = { ...jsonBlock, ...{channel: event.channel}}
    const res = await web.chat.postMessage(mentionResponseBlock)
    console.log('Message sent: ', res.ts)
  } catch (e) {
    console.log(e)
  }
});
```

## Introducing Node SDK Slack Interactive Messages API

We are making progress!!

Now that our bot can send back a message that contains a button, we need to handle the behavior for when the user clicks it.

This of course requires... another package. This time we need the [interactions adapters](https://slack.dev/node-slack-sdk/interactive-messages) from `@slack/interactive-messages`. Similarly to the events adapter, we need to provide a node path where interaction actions can be accepted on our server. Many Slack docs suggest using `/slack/actions`, so that is what I've used here.

```
const { createMessageAdapter } = require('@slack/interactive-messages');

const slackInteractions = createMessageAdapter(process.env.SLACK_SIGNING_SECRET);

app.use('/slack/actions', slackInteractions.expressMiddleware())
```


// todo, you have to register this route somewhere? or is it the default?

### Registering Your Actions Route with Slack

Much like configuring events, we need to tell Slack about our path for accepting interactive actions. In you App Configuration panel, navigate to `Interactive Messages` and fill in the `Request URL`. In my case, it would be `http://13605143.ngrok.io/slack/actions`.

### Listening to an Interaction

Once we have the slackInteraction middleware installed and our path is registered with Slack, we can use the `action_id` on our button to listen to interaction events.

``` 
slackInteractions.action({ actionId: 'open_modal_button' }, async (payload) => {
  try {
    console.log("button click recieved", payload)
  } catch (e) {
    console.log(JSON.stringify(e))
  }

  return {
    text: 'Processing...',
  }
})
```

According to the [Node SDK Docs](https://github.com/slackapi/node-slack-sdk/blob/master/README.md#responding-to-interactive-messages), "The return value is used to update the message where the action occurred immediately. Use [it with] items like buttons and menus that you only want a user to interact with once."

## Building a Modal

Woohoo! We have all the packages we need moving forward, and are ready to [build our modal](https://api.slack.com/surfaces/modals/using).

Note: Slack recently deprecated their old dialog blocks called `dialog` and replaced them with their new blocks, `modals`.
Some of their documentation has yet to be updated, so make sure if you are looking for information about modals, you are reading about `modals` and not `dialogs`.

Again, using the Block Kit Builder, I've designed a modal that looks like this: 

//TODO image of modal

It allows the user to choose a cute animal category from a static list, and create a name for that cute animal.

<details>
<summary>The builder gives me the following JSON:</summary>
<p>

```
{
   "type": "modal",
   "callback": "cute_animal_modal_submit" // We need to add this  
   "title": {
      "type": "plain_text",
      "text": "My App",
      "emoji": true
   },
   "submit": {
      "type": "plain_text",
      "text": "Done",
      "emoji": true
   },
   "close": {
      "type": "plain_text",
      "text": "Cancel",
      "emoji": true
   },
   "blocks": [
      {
         "type": "section",
         "text": {
            "type": "mrkdwn",
            "text": "Thanks for openeing this modal!"
         }
      },
      {
         "type": "input",
         "block_id": "cute_animal_selection_block", // put this here to identify the selection block
         "element": {
            "type": "static_select",
            "action_id": "cute_animal_selection_element", // put this here to identify the selection element
            "placeholder": {
               "type": "plain_text",
               "text": "Select a cute animal",
               "emoji": true
            },
                "options": [
               {
                  "text": {
                     "type": "plain_text",
                     "text": "Puppy",
                     "emoji": true
                  },
                  "value": "puppy"
               },
               {
                  "text": {
                     "type": "plain_text",
                     "text": "Kitten",
                     "emoji": true
                  },
                  "value": "kitten"
               },
               {
                  "text": {
                     "type": "plain_text",
                     "text": "Bunny",
                     "emoji": true
                  },
                  "value": "bunny"
               }
            ]
         },
         "label": {
            "type": "plain_text",
            "text": "Choose a cute pet:",
            "emoji": true
         }
      },
      {
         "type": "input",
         "block_id": "cute_animal_name_block", // put this here to identify the input.
         "element": {
            "type": "plain_text_input",
             "action_id": "cute_animal_name_element" // put this here to identify the selection element

         },
         "label": {
            "type": "plain_text",
            "text": "Give it a cute name:",
            "emoji": true
         }
      }
   ]
}
```
</p>
</details> 

Like before, the Block Kit Builder doesn't put any identifying information on our blocks. To handle a modal submit, we must add a `callback` to our payload.
We also need to put a `block_id` on any block we want to get input data out of later, and an `action_id` that matches to the input element within the block.

I have added the following ids:
- Modal callback: `cute_animal_modal_submit`
- Select Dropdown Block: `cute_animal_selection_block`
- Select Dropdown Element: `cute_animal_selection_element`
- Input Block: `cute_animal_name_block` 
- Input Element: `cute_animal_name_element`

### Handling Modal Submit
With our callback on the block payload, we can again use the Interactive Messages API to listen for a [modal submission](https://api.slack.com/reference/interaction-payloads/views).

``` 
slackInteractions.viewSubmission('cute_animal_modal_submit' , async (payload) => {
  const blockData = payload.view.state

  const cuteAnimalSelection = blockData.values.cute_animal_selection_block.cute_animal_selection_element.value
  const nameInput = blockData.values.cute_animal_name_block.cute_animal_name_element.value

  console.log(cuteAnimalSelection, nameInput) 
  
  return {
    response_action: "clear"
  }
})
```

The return value above tells the modal to close.

### Validation on the Modal

Slack inputs are handy because they have some validation already built-in. By default, inputs are required, and if a user submits an empty input, they get a validation error.

To perform [custom validation](https://api.slack.com/surfaces/modals/using#displaying_errors), you return an error from the viewSubmission event.

Here, I invalidate the cute animal name input, if the name has only one character.

``` 
slackInteractions.viewSubmission('cute_animal_modal_submit' , async (payload) => {
  const cuteAnimalSelection = blockData.values.cute_animal_selection_block.cute_animal_selection_element.value
  const nameInput = blockData.values.cute_animal_name_block.cute_animal_name_element.value

  if (nameInput.length < 2) {
    return {
      "response_action": "errors",
      "errors": {
        "cute_animal_name_block": "Cute animal names must have more than one letter."
      }
    }
  }  
  return {
    response_action: "clear"
  }
})
```

## Conclusion

Wow... we made it, what a wild journey. Overall, I've found the Slack Developer API to be quite powerful, and I love the ability to build metadata-driven views with Block Kit.
With great power, comes great documentation, and digging through all of the potential functionality can be a little daunting. I hope this article was able to consolidate some of the critical pieces of information and makes it easier for you to start your own Slack App with the Node SDK and Express!


