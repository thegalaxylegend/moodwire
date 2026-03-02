
const token = '8797176071:AAH94aYTzx0qP_l6tt0UDXnEh2k1vgDpGfY';
const url = `https://api.telegram.org/bot${token}/getMe`;

fetch(url)
    .then(res => res.json())
    .then(json => console.log(JSON.stringify(json, null, 2)))
    .catch(err => console.error(err));
