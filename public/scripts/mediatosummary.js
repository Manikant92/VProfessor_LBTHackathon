//Any function that you want to be used in other files put it in here
module.exports = {
    getSummaryFromVideo,
    getSummaryFromAudio,
    getInfo,
    getTopics,
    getKeywords
  }
  
  const path = require('path');
  var mime = require('mime');
  const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
  const ffmpeg = require('fluent-ffmpeg');
  ffmpeg.setFfmpegPath(ffmpegPath);
  const fs = require('fs');
  const { Deepgram } = require('@deepgram/sdk')
  
  
  
  const { BlobServiceClient } = require('@azure/storage-blob');
  const { v1: uuidv1 } = require('uuid');
  
  const request = require('request');
  const WebSocket = require('ws')
  const news = require(__dirname + "/newsscraper.js");
  const { TextAnalyticsClient, AzureKeyCredential } = require("@azure/ai-text-analytics");
  const azureTextApikey = 'API KEy';
  const deepgram = new Deepgram("API KEy")
  const endpoint = "Endpoint";
  
  
  
  const AZURE_STORAGE_CONNECTION_STRING = "string";
  
  
  // Converts MP4 file to MP3
  async function convertToMP3(videoFile) {
    return new Promise((resolve, reject) => {
      var filename = videoFile.split('/');
      filename = filename[filename.length - 1];
      var audioFile = 'tmp/' + filename.split('.')[0] + '.wav';
  
      var stream = fs.createWriteStream(audioFile);
      // var readStream = fs.createReadStream(videoFile);
      ffmpeg(videoFile)
        .format('wav')
        // .toFormat('wav')
        .on('start', function (cmd) {
          console.log('Started ' + cmd);
        })
        .on('error', function (err) {
          console.log(err);
          return reject();
        })
        .on('end', function () {
          console.log('Finished processing');
          return resolve();
        })
        .pipe(stream, { end: true })
    });
  }
  
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function transcribe(file){
    // mime.getType(file);
    const streamSource = {
      stream: fs.createReadStream(file),
      mimetype: mime.getType(file),
    };
    
    const response = await deepgram.transcription.preRecorded(streamSource, {
      punctuate: false,
      utterances: true,
    });
    await sleep(20000);
    console.log("DG Response" + response);
    // console.log("Parse :"+response.toString());
    // console.log("JSON Parse: "+ response.data.channel); // channel.alternatives[0].words
    // console.log("JSON Parse: "+ JSON.parse(response));
    var srtTranscript = response.toSRT(); // toWebVTT() //toSRT()
    // srtTranscript.replace(/\d+/g, '')
    srtTranscript = srtTranscript.replace(/\d+/g, '');
    srtTranscript = srtTranscript.replace(/:/g,'');
    srtTranscript = srtTranscript.replace(/-/g,'');
    srtTranscript = srtTranscript.replace(/>/g,'');
    srtTranscript = srtTranscript.replace(/,/g,'');
    console.log("DG SRT Transcript" + srtTranscript);
    return srtTranscript;
  }
  
  async function uploadFile(file) {
    console.log('Azure Blob storage v12 - JavaScript quickstart sample');
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerName = blobServiceClient.getContainerClient('vprofessorai');
    const containerClient = blobServiceClient.getContainerClient(containerName.containerName);
    const blobName = file;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    console.log('\nUploading to Azure storage as blob:\n\t', blobName);
    const uploadBlobResponse = await blockBlobClient.uploadFile(blobName);
    console.log("Blob was uploaded successfully. requestId: ", uploadBlobResponse.requestId);
  }
  
  async function getKeywords(text) {
    console.log(`Transcription Text: ${text}`);
    var documents = [text];
    const keyPhrasesRes = [];
    console.log("== Extract Key Phrases Sample ==");
  
    const client = new TextAnalyticsClient(endpoint, new AzureKeyCredential(azureTextApikey));
  
    const results = await client.extractKeyPhrases(documents);
  
    for (const result of results) {
      console.log(`- Document ${result.id}`);
      if (!result.error) {
        console.log("\tKey phrases:");
        for (const phrase of result.keyPhrases) {
          console.log(`\t- ${phrase}`);
          keyPhrasesRes.push(phrase);
        }
      } else {
        console.error("  Error:", result.error);
      }
    }
    console.log('Key Phrases Response: ', keyPhrasesRes);
    return keyPhrasesRes;
  }
  
  getKeywords().catch((err) => {
    console.error("The sample encountered an error:", err);
  });
  
  /**
   * Webscrapes Wikipedia for pages on the terms
   * @param {} query
   * @returns
   */
  function getWiki(query) {
    return new Promise((resolve, reject) => {
      var url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${query}&format=json`;
      request(url, function (err, response, body) {
        if (err) {
          var error = 'cannot connect to the server';
          return reject(error);
        }
        else {
          var wiki = JSON.parse(body);
          var str1 = query.toLowerCase();
          var str2 = ''
          if (wiki[1][0] != undefined) {
            str2 = wiki[1][0].toLowerCase();
          }
          if (
            str1 === str2 ||
            (str1.substring(str1.length - 1) === 's' && str1.substring(0, str1.length - 1) === str2) ||
            (str2.substring(str2.length - 1) === 's' && str2.substring(0, str2.length - 1) === str1)
          ) {
            return resolve(wiki[3][0]);
          }
          else {
            return resolve('');
          }
        }
      });
    });
  }
  
  /**
   * Obtains summary on the wikipedia pages
   * @param {} query
   * @returns
   */
  function getExtract(query) {
    return new Promise((resolve, reject) => {
      var url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&titles=${query}&formatversion=2&exsentences=10&exlimit=1&explaintext=1`;
      request(url, function (err, response, body) {
        if (err) {
          var error = 'cannot connect to the server';
          reject(error);
        }
        else {
          var extract = JSON.parse(body).query.pages[0].extract;
          if (extract.includes('\n')) {
            return resolve(extract.substring(0, extract.indexOf('\n')));
          }
          else {
            return resolve(extract);
          }
        }
      });
    });
  }
  
  async function getSummaryFromVideo(videoFile) {
    console.log('Video File: ' + videoFile);
    var filename = videoFile.split('/');
    filename = filename[filename.length - 1].split('.')[0];
    var audioFile = 'tmp/' + filename + '.wav';
    console.log('Audio File: ' + audioFile);
    await convertToMP3(videoFile);
    // await sleep(30000);
    console.log();
    var summary = await getSummaryFromAudio(audioFile);
    fs.unlink(videoFile, (err) => {
      if (err) {
        console.error(err)
        return
      }
      //videoFile removed
    })
    return summary;
  }
  
  async function getSummaryFromAudio(audioFile) {
    var transcript = await transcribe(audioFile);
    console.log(`Get Summary Transcription Text: ${transcript}`);
    var summary = getInfo(transcript);
    const path = audioFile;
    fs.unlink(path, (err) => {
      if (err) {
        console.error(err)
        return
      }
      //audioFile removed
    });
    return summary;
  }
  
  async function getInfo(transcript) {
    var topics = await getKeywords(transcript);
    var summary = {};
    summary.transcript = transcript;
    summary.topics = [];
    summary.topics = await getTopics(topics, summary);
  
    console.log();
    console.log('Summary: ')
    console.log(summary);
  
  
    return summary;
  }
  
  async function getTopics(topics, summary) {
    var key = "API KEy"; //api key for youtube videos
    var range = 20;
    if (typeof topics === "undefined") {
      return [];
    }
    if (topics.length < 20) {
      range = topics.length;
    }
    for (var i = 0; i < range; i++) {
      // var wiki = await getWiki(topics[i].label);
      var wiki = await getWiki(topics[i]);
      var title = wiki.split('/');
      title = title[title.length - 1];
      if (title.length > 0) {
        var extract = await getExtract(title);
        if (extract.length > 0 && !extract.includes('may refer to:')) {
          var currevents = await news.getArticles(title.replace(/_/g, ' '), 1);
          console.log(topics[i]);
          // var ytLinks = await vidSearch(key, topics[i].label, 1)
          var ytLinks = await vidSearch(key, topics[i], 1)
          summary.topics.push({
            title: title.replace(/_/g, ' '),
            summary: extract,
            link: wiki,
            articles: currevents,
            youtube: ytLinks
          })
        }
      }
    }
    return summary.topics;
  }
  
  //@params apiKey, query, results
  //@return array of videos
  async function vidSearch(key, query, results) {
    video = [];
    video = await r1(key, query, results, request);
    return video;
  }
  
  function r1(key, query, results, request) {
    return new Promise(function (resolve, reject) {
      var url = "https://www.googleapis.com/youtube/v3/search?key=" + key +
        "&type=video&part=snippet&maxResults=" + results + "&q=" + query;
      const options1 = {
        url: url,
        method: 'GET',
      };
      request(options1, function (err, res, body) {
        video = [];
        if (err) {
          reject(err);
        }
        else {
          console.log(JSON.parse(body).items[0].id);
          video[0] = JSON.parse(body).items[0].id.videoId;
          resolve(video);
        }
      });
    });
  }
  