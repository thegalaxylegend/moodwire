import https from 'node:https';

const base1_options = ["8797176071:AAH94aYTxz0qP_", "8797176071:AAH94aYTzx0qP_"];
const base2 = "6tt";
const base3 = "UDXnEh2k";
const base4 = "vgDpGf";

const v1s = ["1", "l", "I"];
const v2s = ["0", "O"];
// wait, klvg could be k1vg, kIvg, klvg
const v3s = ["1vg", "lvg", "Ivg", "1vg"]; // Ah! The user token has "klvgDpGfy" or something. Let me check the screenshot carefully again. 
// "8797176071:AAH94aYTxz0qP_I6ttOUDXnEh2klvgDpGfY"
// "8797176071:AAH94aYTxz0qP_I6ttOUDXnEh2k1vgDpGfY"

// Let's test precisely what I see:
const tokens = [
    "8797176071:AAH94aYTxz0qP_I6ttOUDXnEh2klvgDpGfY",
    "8797176071:AAH94aYTxz0qP_l6ttOUDXnEh2klvgDpGfY",
    "8797176071:AAH94aYTxz0qP_16ttOUDXnEh2klvgDpGfY",
    "8797176071:AAH94aYTxz0qP_I6ttOUDXnEh2kIvgDpGfY",
    "8797176071:AAH94aYTxz0qP_l6ttOUDXnEh2kIvgDpGfY",
    "8797176071:AAH94aYTxz0qP_16ttOUDXnEh2kIvgDpGfY",
    "8797176071:AAH94aYTxz0qP_I6ttOUDXnEh2k1vgDpGfY",
    "8797176071:AAH94aYTxz0qP_l6ttOUDXnEh2k1vgDpGfY",
    "8797176071:AAH94aYTxz0qP_16ttOUDXnEh2k1vgDpGfY",

    "8797176071:AAH94aYTzx0qP_I6ttOUDXnEh2klvgDpGfY",
    "8797176071:AAH94aYTzx0qP_l6ttOUDXnEh2klvgDpGfY",
    "8797176071:AAH94aYTzx0qP_16ttOUDXnEh2klvgDpGfY",
    "8797176071:AAH94aYTzx0qP_I6ttOUDXnEh2kIvgDpGfY",
    "8797176071:AAH94aYTzx0qP_l6ttOUDXnEh2kIvgDpGfY",
    "8797176071:AAH94aYTzx0qP_16ttOUDXnEh2kIvgDpGfY",
    "8797176071:AAH94aYTzx0qP_I6ttOUDXnEh2k1vgDpGfY",
    "8797176071:AAH94aYTzx0qP_l6ttOUDXnEh2k1vgDpGfY",
    "8797176071:AAH94aYTzx0qP_16ttOUDXnEh2k1vgDpGfY",

    // What if it is DP instead of Dp? No, it's definitely Dp 
    // What if OUDX is 0UDX?
    "8797176071:AAH94aYTxz0qP_I6tt0UDXnEh2klvgDpGfY",
    "8797176071:AAH94aYTxz0qP_l6tt0UDXnEh2klvgDpGfY",
    "8797176071:AAH94aYTxz0qP_16tt0UDXnEh2klvgDpGfY",
    "8797176071:AAH94aYTzx0qP_I6tt0UDXnEh2klvgDpGfY",
    "8797176071:AAH94aYTzx0qP_l6tt0UDXnEh2klvgDpGfY",
    "8797176071:AAH94aYTzx0qP_16tt0UDXnEh2klvgDpGfY",

    // "y" vs "Y"?
    "8797176071:AAH94aYTxz0qP_I6ttOUDXnEh2klvgDpGfy",
    "8797176071:AAH94aYTxz0qP_l6ttOUDXnEh2klvgDpGfy",
    "8797176071:AAH94aYTxz0qP_16ttOUDXnEh2klvgDpGfy",
    "8797176071:AAH94aYTzx0qP_I6ttOUDXnEh2klvgDpGfy",
    "8797176071:AAH94aYTzx0qP_l6ttOUDXnEh2klvgDpGfy",
    "8797176071:AAH94aYTzx0qP_16ttOUDXnEh2klvgDpGfy"
]

function test(token) {
    return new Promise((resolve) => {
        https.get(`https://api.telegram.org/bot${token}/getMe`, (res) => {
            resolve({ token, status: res.statusCode });
        }).on('error', (e) => resolve({ token, status: 500 }));
    });
}

(async () => {
    for (let t of tokens) {
        let res = await test(t);
        if (res.status === 200) {
            console.log('FOUND:', res.token);
            return;
        }
    }
    console.log('FAILED ALL');
})();
