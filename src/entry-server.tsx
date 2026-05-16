
import { StrictMode } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import { Writable } from 'stream'

export function render(url: string, helmetContext: any) {
    return new Promise((resolve, reject) => {
        let body = ''
        const stream = renderToPipeableStream(
            <StrictMode>
                <HelmetProvider context={helmetContext}>
                    <StaticRouter location={url}>
                        <App />
                    </StaticRouter>
                </HelmetProvider>
            </StrictMode>,
            {
                onAllReady() {
                    const writable = new Writable({
                        write(chunk, _encoding, callback) {
                            body += chunk.toString()
                            callback()
                        }
                    })
                    stream.pipe(writable)
                    writable.on('finish', () => resolve(body))
                    writable.on('error', reject)
                },
                onError(err) {
                    reject(err)
                }
            }
        )
    })
}
