
const fetch = require('node-fetch');

async function checkAudiusData() {
    try {
        const hostResponse = await fetch("https://api.audius.co");
        const hostData = await hostResponse.json();
        const host = hostData.data[0];

        console.log(`Using host: ${host}`);

        // Fetch trending to see the structure
        const response = await fetch(`${host}/v1/tracks/trending?limit=1&app_name=MOODWIRE`);
        const data = await response.json();

        if (data.data && data.data.length > 0) {
            const track = data.data[0];
            console.log("Track Data Keys:", Object.keys(track));
            console.log("Genre:", track.genre);
            console.log("Tags:", track.tags);
            console.log("Mood:", track.mood);
        } else {
            console.log("No trending tracks found.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

checkAudiusData();
