const TelegramBot = require('node-telegram-bot-api');
const ISO6391 = require("iso-639-1");
const { validCommands, fetchJokes, translateText, handleJokeRequest } = require('./func');

require("dotenv").config()

const TOKEN = process.env.TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

let userLanguageCode = process.env.DEFAULT_LANG;
let jokes = [];

// Command to set the user's preferred language
bot.onText(/\/?set language (.+)/i, async (msg, match) => {
  try {
    const language = match[1].toLowerCase();
    const isoCode = ISO6391.getCode(language);
    if (isoCode) {
      userLanguageCode = isoCode;
      const langChangeResponse = await translateText(
        "No Problem",
        userLanguageCode
      );
      bot.sendMessage(msg.chat.id, langChangeResponse);
    } else {
      bot.sendMessage(
        msg.chat.id,
        "Unsupported language. Please choose a valid language"
      );
    }
  } catch (error) {
    console.error("Error:", error);
    bot.sendMessage(msg.chat.id, "An error occurred. Please try again");
  }
});

// Command to handle joke request
bot.onText(/^\d+$/, async (msg) => {
  const jokeNumber = parseInt(msg.text);
  await handleJokeRequest(bot, jokes, msg, jokeNumber, userLanguageCode);
});

// Command to handle random joke request
bot.onText(/\/random/, async (msg) => {
  const randomJokeNumber = Math.floor(Math.random() * 102);
  await handleJokeRequest(bot, jokes, msg, randomJokeNumber, userLanguageCode);
});

// Command to handle the /start command
bot.onText(/\/start/, async (msg) => {
  jokes = await fetchJokes();
  userLanguageCode = process.env.DEFAULT_LANG;
  const startMessage = `
  Welcome to ChuckBot, the perfect bot for Chuck Norris jokes' lovers.


  To learn about the available commands type /help
  The default language is English.

  Enjoy!      
  `;
  bot.sendMessage(msg.chat.id, startMessage);
});

// Command to display help and remind users of valid commands
bot.onText(/\/help/, (msg) => {
  const helpMessage = `
  Available commands:
  -------------------
  set language <Your Language>: To set your language.
  <Number>: To get a specific joke. The number must be in the range of 1 to 101.
  /random: Get a random joke.
  /start: Start the bot.
  /help: Show help.
  `;
  bot.sendMessage(msg.chat.id, helpMessage);
});

// Catch-all callback for unsupported commands
bot.onText(/(.+)/, (msg) => {
  const isCommand = validCommands.some((command) => command.test(msg.text));

  if (!isCommand) {
    bot.sendMessage(
      msg.chat.id,
      "Sorry, I didn't understand that command. Please use one of the supported commands."
    );
  }
});