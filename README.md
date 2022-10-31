# VProfressor.ai
A 24x7 Virtual Professor for Students powered by Deepgram STT

### Overview of My Submission

Education is everything. Knowledge empowers anything.

That said, Covid-19 forced students to virtual learning where students are struggling to interact and get timely feedback, new learnings, clarifications with the professor or friends due to various reasons.

To solve the problem, we came up with web application where it helps the students and increase their speed, efficiency of learning and also get their doubts clarified with additional learnings.

VProfessor.ai contains different features designed to facilitate online learning. Users can upload a wav/mp3/ text files. Then, a Deepgram STT transcript of the audio is returned, along with a summary of the data. This includes key words and main topics, Wikipedia page links, current events from NewsAPI, and recommended YouTube videos. From here, users can either read the summary report on the website or download it as a pdf for their personal studying. Additionally, students may "ask the professor" a question, and get a quick short answer for themselves which leverages wolframalpha api's.

### Additional Resources / Info

Demo Video: https://youtu.be/CztanLJiYww

### Dive into Details

- We are leveraging Deepgram Speech-to-Text API and use it to convert audio/video files to a written transcript.
- With Azure Text Analytics, we will generate an analysis report containing transcript, summary, and keywords.
- With that keywords output, we will use the Wikipedia API, NewsAPI to generate links based on the keywords. To provide more information, we will also create a system to search recommended YouTube videos based on a search query, which used the YouTube-Data API.
- We are using Azure Blob Storage to store video/audio files.
- An additional feature of "ask the professor" is provided to users, where users can search any questions or doubts, it fetches the answer from wolframalpha api and displays to user.

### Impact

- It creates a wide impact and provides huge benefits to all Students due to Virtual mode of learning during Covid-19.
- It saves students time and effort where they can get all information at one place.
- It increases efficiency of students/users.
- It improves speed of learning.
- A one stop app which integrates with multiples api's and makes it easy for students for learning.

### Conclusion

- Deepgram STT is so accurate and fast which makes it more reliable for students education. 
- With Deepgram STT comes the whole power for entire application.

### Installation

- Install node modules
- Replace Deepgrams STT API Key, Azure API Keys, NewsAPI key, YouTube API Key, Wolframalpha API key and MediaWiki API keys
- Run node app.js
- Enjoy the application in your local host.
