import axios from 'axios';

async function fetchPlayerData(
  username: string,
  color: string = 'white',
  recentGames: number = 0
) {
  const url = `https://explorer.lichess.ovh/player?player=${encodeURIComponent(
    username
  )}&color=${color}&play=e2e4&recentGames=${recentGames}`;
  console.log(`Fetching data from: ${url}`);
  const res = await axios.get(url, { responseType: 'text' });
  return res.data
    .split('\n')
    .filter((line: string) => line.trim().length > 0)
    .map((line: string) => JSON.parse(line));
}

(async () => {
  const username = process.argv[2] || 'guelder_rose';
  const data = await fetchPlayerData(username, 'white', 3);
  console.log(JSON.stringify(data, null, 2));
})();
