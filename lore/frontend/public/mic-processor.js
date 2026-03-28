// AudioWorklet processor — captures mic PCM and posts Float32 chunks to main thread.
// Replaces the deprecated ScriptProcessorNode / onaudioprocess pattern.
class MicProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]
    if (input.length > 0 && input[0].length > 0) {
      // Copy — the underlying buffer is reused each quantum
      this.port.postMessage(input[0].slice())
    }
    return true
  }
}

registerProcessor('mic-processor', MicProcessor)
