import * as functions from "firebase-functions";
import satori from "satori";
import sharp from "sharp";
import { readFileSync } from "fs";
import { join } from "path";

// Load font at cold start
const fontPath = join(__dirname, "../../assets/Inter-Bold.ttf");
const interBold = readFileSync(fontPath);

export const ogImage = functions.https.onRequest(async (req, res) => {
    try {
        const title = req.query.title ? String(req.query.title) : "Exam Compass Guide";
        const sub = req.query.sub ? String(req.query.sub) : "examcompass.pages.dev";

        const svg = await satori(
            {
                type: 'div',
                props: {
                    style: {
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#000000',
                        backgroundImage: 'radial-gradient(circle at 25px 25px, #333 2%, transparent 0%), radial-gradient(circle at 75px 75px, #333 2%, transparent 0%)',
                        backgroundSize: '100px 100px',
                        color: 'white',
                    },
                    children: [
                        {
                            type: 'div',
                            props: {
                                style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: '40px 80px',
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    border: '2px solid rgba(139, 92, 246, 0.3)',
                                    borderRadius: '32px',
                                    boxShadow: '0 20px 60px rgba(139, 92, 246, 0.2)',
                                    maxWidth: '1000px',
                                },
                                children: [
                                    {
                                        type: 'div',
                                        props: {
                                            style: {
                                                fontSize: '80px',
                                                fontWeight: 700,
                                                letterSpacing: '-2px',
                                                textAlign: 'center',
                                                marginBottom: '30px',
                                                textTransform: 'tight',
                                                lineHeight: 1.1,
                                            },
                                            children: title
                                        }
                                    },
                                    {
                                        type: 'div',
                                        props: {
                                            style: {
                                                fontSize: '32px',
                                                color: '#c084fc',
                                                fontWeight: 700,
                                                letterSpacing: '2px',
                                            },
                                            children: sub
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            } as any,
            {
                width: 1200,
                height: 630,
                fonts: [
                    {
                        name: 'Inter',
                        data: interBold,
                        weight: 700,
                        style: 'normal',
                    },
                ],
            }
        );

        const pngBuffer = await sharp(Buffer.from(svg))
            .png()
            .toBuffer();

        // 24 hour CDN cache, 1 hour browser cache
        res.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
        res.set("Content-Type", "image/png");
        res.status(200).send(pngBuffer);
    } catch (error) {
        console.error("Error generating OG image:", error);
        res.status(500).send("Error generating image");
    }
});
