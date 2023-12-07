const cheerio = require("cheerio");
const axios = require("axios");
const { Translate } = require("@google-cloud/translate").v2;
const credentials = require("/home/ec2-user/chuck-norris-telegram-bot/elaborate-chess-407319-b358063d66c9.json");

require("dotenv").config();

const JOKES_URL = process.env.JOKES_URL;
const translate = new Translate({ credentials });

const headers = {
    Accept: "text/html",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.5",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:105.0) Gecko/20100101 Firefox/105.0",
};

// List of valid commands
const validCommands = [/\/start/, /\/help/, /\/random/, /set language .+/i, /^\d+$/];

// Function to extract jokes from HTML using Cheerio
const extractJokes = ($) => {
    const jokes = [];
  
    $(".m-detail--body ol li").each((index, elem) => {
      const joke = $(elem);
      jokes.push(joke.text());
    });
  
    return jokes;
};

// Function to fetch jokes from the specified URL
const fetchJokes = async () => {
    try {
      const response = await axios.get(JOKES_URL, { headers });
      const html = response.data;
      const $ = cheerio.load(html);
  
      return extractJokes($);
    } catch (error) {
      console.error("Error fetching jokes:", error);
      return [];
    }
};

// Function to translate text using Google Cloud Translate
const translateText = async (text, targetLang) => {
    let translation = await translate.translate(text, targetLang);
    return translation[0];
};

/* Function to handle a user's joke request by validating the requested joke number, 
 * translating the joke and sending the translated joke
 * as a Telegram message */
const handleJokeRequest = async (bot, jokes, msg, jokeNumber, userLanguageCode) => {
    try {
      // Validate the joke number
      if (jokeNumber < 1 || jokeNumber > 101) {
        bot.sendMessage(
          msg.chat.id,
          "Please enter a valid number between 1 and 101"
        );
        return;
      }
  
      // Get the requested joke and translate it
      const joke = jokes[jokeNumber - 1];
      if (joke) {
        const translatedJoke = await translateText(joke, userLanguageCode);
        bot.sendMessage(msg.chat.id, `${jokeNumber}. ${translatedJoke}`);
      } else {
        bot.sendMessage(
          msg.chat.id,
          "Could not fetch your joke. Please try again"
        );
      }
    } catch (error) {
      console.error("Error", error);
      bot.sendMessage(msg.chat.id, "Error translating joke. Please try again");
    }
};

module.exports = {
    validCommands,
    extractJokes,
    fetchJokes,
    translateText,
    handleJokeRequest,
};

