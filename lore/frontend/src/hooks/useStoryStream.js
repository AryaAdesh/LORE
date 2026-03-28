import { useState, useEffect } from 'react'

export function useStoryStream(url, options = {}) {
  const [chapters, setChapters] = useState([])
  const [status, setStatus] = useState('idle')
  const [storyId, setStoryId] = useState(null)
  const [totalChapters, setTotalChapters] = useState(0)

  // Using standard EventSource via fetch-sse or backend needs to handle GET
  // Actually, standard EventSource only supports GET. The backend has @app.post("/story/create")
  // We can use the fetch API to process the SSE stream if it's a POST, or the backend accepts it.
  // We will assume backend supports it or use EventSource for now based on LLD
  
  // Custom SSE client using fetch to support POST bodies
  useEffect(() => {
    if (!url) return;
    setStatus('connecting');
    setChapters([]);
    
    const abortCtrl = new AbortController();
    
    async function stream() {
      try {
        const fetchUrl = url instanceof Request ? url.url : url;
        const fetchInit = url instanceof Request ? { ...options, body: url.body, method: url.method } : { ...options, method: options.body ? 'POST' : 'GET' };
        
        // Wait, standard SSE event names are needed.
        // Let's implement a simple stream reader.
        const res = await fetch(url.url || url, { 
          method: url.method || 'GET', 
          headers: {
            'Content-Type': url.body instanceof FormData ? '' : 'application/json',
            'Accept': 'text/event-stream'
          },
          body: url.body,
          signal: abortCtrl.signal 
        });
        
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        
        setStatus('generating');

        while(true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          
          let eolIndex;
          while ((eolIndex = buffer.indexOf('\n\n')) >= 0) {
            const block = buffer.slice(0, eolIndex);
            buffer = buffer.slice(eolIndex + 2);
            
            const lines = block.split('\n');
            let eventName = 'message';
            let dataStr = '';
            
            for (let line of lines) {
              if (line.startsWith('event: ')) eventName = line.substring(7);
              else if (line.startsWith('data: ')) dataStr = line.substring(6);
            }
            
            if (dataStr) {
              const data = JSON.parse(dataStr);
              if (eventName === 'story_meta') {
                setStoryId(data.id);
                setTotalChapters(data.total_chapters);
              } else if (eventName === 'chapter_ready') {
                setChapters(prev => [...prev, data]);
              } else if (eventName === 'story_complete') {
                setStatus('ready');
              } else if (eventName === 'error') {
                setStatus('error');
              }
            }
          }
        }
      } catch(e) {
        if(e.name !== 'AbortError') setStatus('error');
      }
    }
    
    stream();
    return () => abortCtrl.abort();
  }, [url]);

  return { chapters, status, storyId, totalChapters }
}
