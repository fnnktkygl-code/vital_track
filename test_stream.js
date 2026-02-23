
async function testStream() {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        console.error('No API KEY');
        return;
    }
    const endpoint = `https://vital-track-ai-proxy.onrender.com/v1/chat?stream=true`;
    const payload = {
        query: "Hello"
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        console.log("BUFFER: ", buffer);
        let boundary = buffer.indexOf('\n');
        while (boundary !== -1) {
            const line = buffer.slice(0, boundary).trim();
            console.log("LINE: ", line);
            buffer = buffer.slice(boundary + 1);

            if (line.startsWith('data: ')) {
                const jsonStr = line.substring(6).trim();
                if (jsonStr) {
                    try {
                        const data = JSON.parse(jsonStr);
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        if (text) {
                            console.log(`data: ${JSON.stringify({ text })}\n\n`);
                        }
                    } catch (e) {
                    }
                }
            }
            boundary = buffer.indexOf('\n');
        }
    }
}

testStream();
