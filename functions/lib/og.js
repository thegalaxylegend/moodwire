"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ogImage = void 0;
const functions = __importStar(require("firebase-functions"));
const satori_1 = __importDefault(require("satori"));
const sharp_1 = __importDefault(require("sharp"));
const fs_1 = require("fs");
const path_1 = require("path");
const fontPath = (0, path_1.join)(__dirname, "../../assets/Inter-Bold.ttf");
const interBold = (0, fs_1.readFileSync)(fontPath);
exports.ogImage = functions.https.onRequest(async (req, res) => {
    try {
        const title = req.query.title ? String(req.query.title) : "Exam Compass Guide";
        const sub = req.query.sub ? String(req.query.sub) : "examcompass.pages.dev";
        const svg = await (0, satori_1.default)({
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
        }, {
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
        });
        const pngBuffer = await (0, sharp_1.default)(Buffer.from(svg))
            .png()
            .toBuffer();
        res.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
        res.set("Content-Type", "image/png");
        res.status(200).send(pngBuffer);
    }
    catch (error) {
        console.error("Error generating OG image:", error);
        res.status(500).send("Error generating image");
    }
});
//# sourceMappingURL=og.js.map